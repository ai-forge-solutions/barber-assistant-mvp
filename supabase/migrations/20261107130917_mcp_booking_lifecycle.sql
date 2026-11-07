-- Additive lifecycle change; apply after 20261106184407_mcp_booking.sql.
-- Existing appointments (including pending) are deliberately left untouched.
begin;

create or replace function public.mcp_confirm_booking(p_user uuid,p_proposal uuid,p_resource text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  proposal public.mcp_booking_proposals%rowtype;
  appointment public.appointments%rowtype;
  v record;
begin
  -- Preserve proposal ownership, audience binding, locks and retry semantics.
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
    insert into public.appointments(shop_id,barber_id,client_id,service_id,starts_at,ends_at,status,reminder_sent)
    values(proposal.shop_id,proposal.barber_id,p_user,proposal.service_id,proposal.starts_at,proposal.ends_at,'confirmed',false)
    returning * into appointment;
    update public.mcp_booking_proposals set appointment_id=appointment.id where id=proposal.id;
  end if;
  return jsonb_build_object('id',appointment.id,'shop_id',appointment.shop_id,
    'barber_id',appointment.barber_id,'service_id',appointment.service_id,
    'starts_at',appointment.starts_at,'ends_at',appointment.ends_at,'status',appointment.status);
end;
$$;

-- p_user and p_resource are supplied by the authenticated MCP boundary, never
-- by tool input. Resource/grant binding is checked there; SQL only gates format.
-- Do not require a proposal/grant lookup here: own web appointments are eligible.
create or replace function public.mcp_cancel_booking(p_user uuid,p_appointment uuid,p_resource text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  appointment public.appointments%rowtype;
begin
  if p_resource is null or length(p_resource) not between 1 and 2048
    or p_resource !~ '^https?://[^/?#[:space:]]+([/?][^#[:space:]]*)?$' then
    raise exception 'booking_resource_invalid';
  end if;
  -- Filter by owner BEFORE revealing existence, state or timestamps. NULL user
  -- and NULL appointment naturally match nothing (fail closed).
  select * into appointment from public.appointments
    where id=p_appointment and client_id=p_user for update;
  if not found then raise exception 'booking_appointment_not_found'; end if;

  -- Retries preserve the entire row, even after the original appointment time.
  if appointment.status is distinct from 'cancelled' then
    -- Evaluate the wall clock AFTER acquiring the row lock, not transaction now().
    if appointment.status is null or appointment.status not in ('pending','confirmed')
      or appointment.starts_at is null or not isfinite(appointment.starts_at)
      or appointment.starts_at <= clock_timestamp() then
      raise exception 'booking_cancellation_not_allowed';
    end if;
    update public.appointments set status='cancelled' where id=appointment.id
      returning * into appointment;
  end if;
  return jsonb_build_object('id',appointment.id,'shop_id',appointment.shop_id,
    'barber_id',appointment.barber_id,'service_id',appointment.service_id,
    'starts_at',appointment.starts_at,'ends_at',appointment.ends_at,'status',appointment.status);
end;
$$;

revoke all on function public.mcp_cancel_booking(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.mcp_cancel_booking(uuid,uuid,text) to service_role;
revoke all on function public.mcp_confirm_booking(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.mcp_confirm_booking(uuid,uuid,text) to service_role;
notify pgrst, 'reload schema';
commit;
