-- Explicit customer preference, not tenancy/membership. No automatic backfill.
begin;
create table if not exists public.customer_shop_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_shop_id uuid references public.shops(id) on delete set null,
  updated_at timestamptz not null default now()
);
comment on table public.customer_shop_preferences is 'Explicit customer default shop; never an access restriction or inferred from booking history. Server-only for the MCP pilot.';
alter table public.customer_shop_preferences enable row level security;
revoke all on public.customer_shop_preferences from public, anon, authenticated;
grant select, insert, update, delete on public.customer_shop_preferences to service_role;

create or replace function public.mcp_known_shops(p_user_id uuid)
returns table(id uuid, name text, slug text, address text, timezone text, last_booked_at timestamptz, booking_count bigint)
language sql stable security definer set search_path = public
as $$
  select sh.id, sh.name, sh.slug, sh.address, sh.timezone, max(a.starts_at), count(*)
  from public.appointments a
  left join public.services s on s.id = a.service_id
  left join public.barbers b on b.id = a.barber_id
  join public.shops sh on sh.id = coalesce(a.shop_id, s.shop_id, b.shop_id)
  where a.client_id = p_user_id
  group by sh.id, sh.name, sh.slug, sh.address, sh.timezone
  order by max(a.starts_at) desc, sh.id;
$$;
comment on function public.mcp_known_shops(uuid) is 'All shops from one authenticated customer booking history, including cancelled bookings; not verified visits or favorites. Service-role only: caller must derive p_user_id from authorization.';
revoke all on function public.mcp_known_shops(uuid) from public, anon, authenticated;
grant execute on function public.mcp_known_shops(uuid) to service_role;
create or replace function public.mcp_my_appointments(p_user_id uuid, p_shop_id uuid default null)
returns table(id uuid, starts_at timestamptz, ends_at timestamptz, status text, shop_id uuid, shop jsonb, service jsonb, barber jsonb)
language sql stable security definer set search_path = public
as $$
  select a.id, a.starts_at, a.ends_at, a.status::text, sh.id,
    case when sh.id is not null then jsonb_build_object('id',sh.id,'name',sh.name,'slug',sh.slug,'address',sh.address,'timezone',sh.timezone) end,
    case when s.id is not null then jsonb_build_object('id',s.id,'name',s.name,'durationMin',s.duration_min,'price',s.price) end,
    case when b.id is not null then jsonb_build_object('id',b.id,'name',b.display_name) end
  from public.appointments a
  left join public.services s on s.id = a.service_id
  left join public.barbers b on b.id = a.barber_id
  left join public.shops sh on sh.id = coalesce(a.shop_id, s.shop_id, b.shop_id)
  where a.client_id = p_user_id and (p_shop_id is null or sh.id = p_shop_id)
  order by a.starts_at desc, a.id
  limit 201;
$$;
comment on function public.mcp_my_appointments(uuid,uuid) is 'Own appointments, optional shop filter BEFORE pagination; explicit safe fields, legacy shop_id fallback. Service-role only.';
revoke all on function public.mcp_my_appointments(uuid,uuid) from public, anon, authenticated;
grant execute on function public.mcp_my_appointments(uuid,uuid) to service_role;
notify pgrst, 'reload schema';
commit;
