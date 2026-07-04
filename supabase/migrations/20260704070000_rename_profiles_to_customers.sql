do $$
begin
  if to_regclass('public.customers') is null and to_regclass('public.profiles') is not null then
    alter table public.profiles rename to customers;
  end if;
end $$;

alter table if exists public.customers enable row level security;

drop policy if exists "profiles_select_own" on public.customers;
drop policy if exists "profiles_insert_own" on public.customers;
drop policy if exists "profiles_update_own" on public.customers;
drop policy if exists "customers_select_own" on public.customers;
drop policy if exists "customers_insert_own" on public.customers;
drop policy if exists "customers_update_own" on public.customers;

create policy "customers_select_own"
  on public.customers
  for select
  using (auth.uid() = id);

create policy "customers_insert_own"
  on public.customers
  for insert
  with check (auth.uid() = id);

create policy "customers_update_own"
  on public.customers
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, insert, update on table public.customers to authenticated;
grant select, insert, update, delete on table public.customers to service_role;

create index if not exists customers_phone_idx on public.customers(phone);

-- Keep customers as client/customer records only. Barbers have their own table.
-- If a barber has also booked as a client, keep their customer record.
delete from public.customers customer
where exists (
  select 1
  from public.barbers barber
  where barber.user_id = customer.id
)
and not exists (
  select 1
  from public.appointments appointment
  where appointment.client_id = customer.id
);
