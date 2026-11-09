-- MCP pilot. Apply ONLY to the barber app project, never the global Velz DB.
-- Entire migration is atomic: legacy overlaps fail closed; no data is deleted.
begin;
create extension if not exists btree_gist;
-- Prevent a legacy web writer racing the preflight / exclusion installation.
lock table public.appointments in access exclusive mode;
do $$
begin
  if exists (
    select 1 from public.appointments a join public.appointments b
      on a.barber_id = b.barber_id and a.id < b.id
     and a.status <> 'cancelled' and b.status <> 'cancelled'
     and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(b.starts_at,b.ends_at,'[)')
  ) then
    raise exception 'mcp_migration_existing_overlaps: resolve manually; no appointments changed';
  end if;
end $$;
-- This protects ALL insert/update paths, including the legacy web API.
alter table public.appointments add constraint appointments_barber_no_overlap
  exclude using gist (barber_id with =, tstzrange(starts_at,ends_at,'[)') with &&)
  where (status <> 'cancelled');

create table public.mcp_booking_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  resource text not null check (length(resource) between 1 and 2048),
  shop_id uuid not null references public.shops(id),
  barber_id uuid not null references public.barbers(id),
  service_id uuid not null references public.services(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  price numeric not null,
  service_name text not null,
  barber_name text not null,
  shop_name text not null,
  timezone text not null,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  appointment_id uuid unique references public.appointments(id),
  created_at timestamptz not null default now()
);
create index mcp_booking_proposals_user_idx on public.mcp_booking_proposals(user_id,created_at);
alter table public.mcp_booking_proposals enable row level security;
revoke all on public.mcp_booking_proposals from public, anon, authenticated;
grant select, insert, update, delete on public.mcp_booking_proposals to service_role;
create policy mcp_booking_proposals_service_only on public.mcp_booking_proposals
  for all to service_role using (true) with check (true);

-- Resolve by the shop's IANA timezone, rejecting both DST folds and gaps.
create function public.mcp_unique_local_instant(p_local timestamp, p_zone text)
returns timestamptz language sql stable security definer set search_path = pg_catalog, public
as $$
  with offsets as (
    select distinct timezone(p_zone,s) - timezone('UTC',s) as delta
    from generate_series(timezone('UTC',p_local)-interval '36 hours',
                         timezone('UTC',p_local)+interval '36 hours',interval '6 hours') s
  ), candidates as (
    select timezone('UTC',p_local-delta) as instant from offsets
    where timezone(p_zone,timezone('UTC',p_local-delta)) = p_local
  )
  select case when count(*) = 1 then min(instant) end from candidates;
$$;

-- Authoritative revalidation shared by prepare and confirm. The barber row
-- serializes MCP confirmations; table SHARE locks also prevent concurrent schedule
-- or block edits (including phantom inserts via the existing dashboard APIs).
-- Coarse locks are intentionally conservative for this low-volume pilot.
create function public.mcp_validate_booking(
  p_user uuid,p_shop uuid,p_barber uuid,p_service uuid,p_start timestamptz
) returns table(ends_at timestamptz,price numeric,service_name text,barber_name text,shop_name text)
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  b public.barbers%rowtype;
  s public.services%rowtype;
  sh public.shops%rowtype;
  local_start timestamp;
  local_end timestamp;
  finish timestamptz;
begin
  if p_user is null or p_start is null or not isfinite(p_start) or p_start <= clock_timestamp() then
    raise exception 'booking_invalid_time';
  end if;
  if not exists(select 1 from public.customers c where c.id=p_user
    and length(btrim(c.full_name))>0 and length(btrim(c.phone))>0) then
    raise exception 'booking_profile_required';
  end if;
  select * into b from public.barbers where id=p_barber for update;
  if not found or b.shop_id is distinct from p_shop or b.is_active is not true then
    raise exception 'booking_barber_unavailable';
  end if;
  select * into s from public.services where id=p_service for share;
  if not found or s.shop_id is distinct from p_shop or s.is_active is not true
    or s.duration_min is null or s.duration_min <= 0 or s.duration_min > 1440
    or s.price is null or s.price < 0 then
    raise exception 'booking_service_unavailable';
  end if;
  select * into sh from public.shops where id=p_shop for share;
  if not found or sh.timezone is null or not exists(select 1 from pg_timezone_names where name=sh.timezone) then
    raise exception 'booking_shop_timezone_invalid';
  end if;
  lock table public.shop_subscriptions in share mode;
  if public.shop_has_active_subscription(p_shop) is not true then
    raise exception 'booking_subscription_required';
  end if;
  finish := p_start + make_interval(mins => s.duration_min);
  local_start := timezone(sh.timezone,p_start);
  local_end := timezone(sh.timezone,finish);
  if local_start::date <> local_end::date
    or date_trunc('minute',local_start) <> local_start
    or local_end-local_start <> make_interval(mins => s.duration_min)
    or public.mcp_unique_local_instant(local_start,sh.timezone) is distinct from p_start
    or public.mcp_unique_local_instant(local_end,sh.timezone) is distinct from finish then
    raise exception 'booking_local_time_invalid';
  end if;
  lock table public.schedules, public.blocked_slots in share mode;
  if not exists (
    select 1 from public.schedules sc
    where sc.barber_id=p_barber and sc.day_of_week=extract(dow from local_start)::int
      and sc.start_time <= local_start::time and sc.end_time >= local_end::time
      and sc.start_time < sc.end_time
      -- Same service-duration grid as the web availability generator.
      and mod(extract(epoch from (local_start::time - sc.start_time)),s.duration_min * 60) = 0
      and ((sc.break_start is null and sc.break_end is null) or
        (sc.break_start is not null and sc.break_end is not null and sc.break_start < sc.break_end
         and (local_end::time <= sc.break_start or local_start::time >= sc.break_end)))
  ) then raise exception 'booking_outside_schedule'; end if;
  if exists(select 1 from public.blocked_slots bs where bs.barber_id=p_barber
      and bs.starts_at < finish and bs.ends_at > p_start)
    or exists(select 1 from public.appointments a where a.barber_id=p_barber
      and a.status <> 'cancelled' and a.starts_at < finish and a.ends_at > p_start) then
    raise exception 'booking_slot_unavailable';
  end if;
  return query select finish,s.price,s.name,coalesce(b.display_name,'Barbero'),sh.name;
end;
$$;

create function public.mcp_prepare_booking(
  p_user uuid,p_resource text,p_shop uuid,p_barber uuid,p_service uuid,p_start timestamptz
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v record;
  proposal public.mcp_booking_proposals%rowtype;
begin
  if p_resource is null or length(p_resource) not between 1 and 2048 then
    raise exception 'booking_resource_invalid';
  end if;
  select * into v from public.mcp_validate_booking(p_user,p_shop,p_barber,p_service,p_start);
  insert into public.mcp_booking_proposals
    (user_id,resource,shop_id,barber_id,service_id,starts_at,ends_at,price,service_name,barber_name,shop_name,timezone,expires_at)
  values(p_user,p_resource,p_shop,p_barber,p_service,p_start,v.ends_at,v.price,v.service_name,v.barber_name,v.shop_name,
    (select timezone from public.shops where id=p_shop),clock_timestamp()+interval '10 minutes')
  returning * into proposal;
  return jsonb_build_object('proposalId',proposal.id,'expiresAt',proposal.expires_at,
    'shopId',p_shop,'barberId',p_barber,'serviceId',p_service,'startsAt',p_start,'endsAt',proposal.ends_at,
    'price',proposal.price,'serviceName',proposal.service_name,'barberName',proposal.barber_name,
    'shopName',proposal.shop_name,'timezone',proposal.timezone,'currency','EUR',
    'localStartsAt',timezone(proposal.timezone,proposal.starts_at),
    'localEndsAt',timezone(proposal.timezone,proposal.ends_at),'requiresConfirmation',true);
end;
$$;

create function public.mcp_confirm_booking(p_user uuid,p_proposal uuid,p_resource text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  proposal public.mcp_booking_proposals%rowtype;
  appointment public.appointments%rowtype;
  v record;
begin
  -- Never reveal existence to a different principal or OAuth resource audience.
  select * into proposal from public.mcp_booking_proposals
    where id=p_proposal and user_id=p_user and resource=p_resource for update;
  if not found then raise exception 'booking_proposal_not_found'; end if;
  if proposal.appointment_id is not null then
    select * into appointment from public.appointments where id=proposal.appointment_id;
    if not found then raise exception 'booking_appointment_missing'; end if;
  else
    if proposal.expires_at <= clock_timestamp() then raise exception 'booking_proposal_expired'; end if;
    select * into v from public.mcp_validate_booking(p_user,proposal.shop_id,proposal.barber_id,proposal.service_id,proposal.starts_at);
    if v.ends_at is distinct from proposal.ends_at or v.price is distinct from proposal.price
      or v.service_name is distinct from proposal.service_name
      or v.barber_name is distinct from proposal.barber_name
      or v.shop_name is distinct from proposal.shop_name
      or proposal.timezone is distinct from (select timezone from public.shops where id=proposal.shop_id) then
      raise exception 'booking_service_changed_prepare_again';
    end if;
    -- Explicit shop_id: never rely on the insecure legacy POST or its defaults.
    insert into public.appointments(shop_id,barber_id,client_id,service_id,starts_at,ends_at,status,reminder_sent)
    values(proposal.shop_id,proposal.barber_id,p_user,proposal.service_id,proposal.starts_at,proposal.ends_at,'pending',false)
    returning * into appointment;
    update public.mcp_booking_proposals set appointment_id=appointment.id where id=proposal.id;
  end if;
  -- DTO only: no client id, phone, email, auth metadata, or raw customer object.
  return jsonb_build_object('id',appointment.id,'shop_id',appointment.shop_id,
    'barber_id',appointment.barber_id,'service_id',appointment.service_id,
    'starts_at',appointment.starts_at,'ends_at',appointment.ends_at,'status',appointment.status);
end;
$$;

-- Read-only DTO generation; never expose another customer's appointment rows.
-- The candidate grid matches the legacy web generator, but timezone conversion,
-- overlaps and every booking gate are validated by the same authoritative RPC.
create function public.mcp_booking_availability(
  p_user uuid,p_shop uuid,p_barber uuid,p_service uuid,p_date date
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  b public.barbers%rowtype;
  s public.services%rowtype;
  sh public.shops%rowtype;
  candidate timestamp;
  instant timestamptz;
  v record;
  slots jsonb := '[]'::jsonb;
begin
  if p_date is null or not isfinite(p_date) then raise exception 'booking_invalid_date'; end if;
  if not exists(select 1 from public.customers c where c.id=p_user
    and length(btrim(c.full_name))>0 and length(btrim(c.phone))>0) then
    raise exception 'booking_profile_required';
  end if;
  select * into b from public.barbers where id=p_barber for update;
  if not found or b.shop_id is distinct from p_shop or b.is_active is not true then
    raise exception 'booking_barber_unavailable';
  end if;
  select * into s from public.services where id=p_service for share;
  if not found or s.shop_id is distinct from p_shop or s.is_active is not true
    or s.duration_min is null or s.duration_min <= 0 or s.duration_min > 1440
    or s.price is null or s.price < 0 then raise exception 'booking_service_unavailable'; end if;
  select * into sh from public.shops where id=p_shop for share;
  if not found or sh.timezone is null or not exists(select 1 from pg_timezone_names where name=sh.timezone) then
    raise exception 'booking_shop_timezone_invalid';
  end if;
  lock table public.shop_subscriptions in share mode;
  if public.shop_has_active_subscription(p_shop) is not true then raise exception 'booking_subscription_required'; end if;
  lock table public.schedules, public.blocked_slots in share mode;
  for candidate in
    select distinct g from public.schedules sc
    cross join lateral generate_series(p_date+sc.start_time,
      p_date+sc.end_time-make_interval(mins=>s.duration_min),make_interval(mins=>s.duration_min)) g
    where sc.barber_id=p_barber and sc.day_of_week=extract(dow from p_date)::int
      and sc.start_time<sc.end_time order by g
  loop
    instant := public.mcp_unique_local_instant(candidate,sh.timezone);
    if instant is null or instant <= clock_timestamp() then continue; end if;
    begin
      select * into v from public.mcp_validate_booking(p_user,p_shop,p_barber,p_service,instant);
      slots := slots || jsonb_build_array(jsonb_build_object('startsAt',instant,'endsAt',v.ends_at,
        'localStart',candidate,'localEnd',timezone(sh.timezone,v.ends_at)));
    exception when raise_exception then
      if sqlerrm not in ('booking_slot_unavailable','booking_outside_schedule','booking_local_time_invalid','booking_invalid_time') then raise; end if;
    end;
  end loop;
  return jsonb_build_object('shopId',p_shop,'barberId',p_barber,'serviceId',p_service,
    'date',p_date,'timezone',sh.timezone,'price',s.price,'currency','EUR','durationMin',s.duration_min,
    'slots',slots,'serverTime',clock_timestamp());
end;
$$;
revoke all on function public.mcp_booking_availability(uuid,uuid,uuid,uuid,date) from public,anon,authenticated;
grant execute on function public.mcp_booking_availability(uuid,uuid,uuid,uuid,date) to service_role;

revoke all on function public.mcp_unique_local_instant(timestamp,text) from public,anon,authenticated;
revoke all on function public.mcp_validate_booking(uuid,uuid,uuid,uuid,timestamptz) from public,anon,authenticated;
revoke all on function public.mcp_prepare_booking(uuid,text,uuid,uuid,uuid,timestamptz) from public,anon,authenticated;
revoke all on function public.mcp_confirm_booking(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.mcp_unique_local_instant(timestamp,text) to service_role;
grant execute on function public.mcp_validate_booking(uuid,uuid,uuid,uuid,timestamptz) to service_role;
grant execute on function public.mcp_prepare_booking(uuid,text,uuid,uuid,uuid,timestamptz) to service_role;
grant execute on function public.mcp_confirm_booking(uuid,uuid,text) to service_role;
commit;
