grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

insert into public.profiles (
  id,
  full_name,
  phone,
  phone_country_code,
  phone_dial_code
)
select
  users.id,
  coalesce(
    nullif(users.raw_user_meta_data->>'full_name', ''),
    nullif(users.raw_user_meta_data->>'name', ''),
    ''
  ) as full_name,
  coalesce(
    nullif(users.raw_user_meta_data->>'phone', ''),
    nullif(users.raw_user_meta_data->>'mobile', ''),
    nullif(users.raw_user_meta_data->>'phone_number', ''),
    ''
  ) as phone,
  nullif(users.raw_user_meta_data->>'phone_country_code', '') as phone_country_code,
  nullif(users.raw_user_meta_data->>'phone_dial_code', '') as phone_dial_code
from auth.users
where
  coalesce(
    nullif(users.raw_user_meta_data->>'full_name', ''),
    nullif(users.raw_user_meta_data->>'name', ''),
    nullif(users.raw_user_meta_data->>'phone', ''),
    nullif(users.raw_user_meta_data->>'mobile', ''),
    nullif(users.raw_user_meta_data->>'phone_number', '')
  ) is not null
on conflict (id) do update set
  full_name = case
    when public.profiles.full_name = '' then excluded.full_name
    else public.profiles.full_name
  end,
  phone = case
    when public.profiles.phone = '' then excluded.phone
    else public.profiles.phone
  end,
  phone_country_code = coalesce(public.profiles.phone_country_code, excluded.phone_country_code),
  phone_dial_code = coalesce(public.profiles.phone_dial_code, excluded.phone_dial_code);
