-- trujas MCP pilot only. Apply to project gnskwavxxipvwpznzzdh after review.
-- Never apply using ambient/global database credentials (those belong to another project).
begin;

create table public.mcp_oauth_clients (
  client_id text primary key,
  client_name text not null check (length(client_name) between 1 and 120),
  redirect_uris jsonb not null check (jsonb_typeof(redirect_uris) = 'array' and jsonb_array_length(redirect_uris) between 1 and 10),
  created_at timestamptz not null default now()
);
create index mcp_oauth_clients_created on public.mcp_oauth_clients(created_at);
create table public.mcp_oauth_codes (
  code_hash text primary key check (code_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null references public.mcp_oauth_clients(client_id) on delete cascade,
  redirect_uri text not null,
  challenge text not null check (challenge ~ '^[A-Za-z0-9_-]{43}$'),
  resource text not null,
  scope text not null,
  expires_at timestamptz not null
);
create index mcp_oauth_codes_user on public.mcp_oauth_codes(user_id);
create index mcp_oauth_codes_expiry on public.mcp_oauth_codes(expires_at);
create table public.mcp_oauth_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null references public.mcp_oauth_clients(client_id) on delete cascade,
  resource text not null,
  scope text not null,
  access_hash text not null unique check (access_hash ~ '^[a-f0-9]{64}$'),
  refresh_hash text not null unique check (refresh_hash ~ '^[a-f0-9]{64}$'),
  access_expires_at timestamptz not null,
  refresh_expires_at timestamptz not null,
  revoked_at timestamptz
);
create index mcp_oauth_grants_user on public.mcp_oauth_grants(user_id);

alter table public.mcp_oauth_clients enable row level security;
alter table public.mcp_oauth_codes enable row level security;
alter table public.mcp_oauth_grants enable row level security;
-- No browser policies: all operations go through the server service client.
revoke all on public.mcp_oauth_clients, public.mcp_oauth_codes, public.mcp_oauth_grants from public, anon, authenticated;
grant select, insert, update, delete on public.mcp_oauth_clients, public.mcp_oauth_codes, public.mcp_oauth_grants to service_role;

-- Atomic DELETE means only one contender can consume a code, even across instances.
-- INSERT and DELETE share a transaction: failed grant insertion restores the code.
create function public.mcp_oauth_exchange_code(
  p_client_id text, p_resource text, p_access_hash text, p_new_refresh_hash text,
  p_code_hash text, p_redirect_uri text, p_challenge text
) returns table (scope text)
language sql security invoker set search_path = '' as $$
  with consumed as (
    delete from public.mcp_oauth_codes c
    where c.code_hash = p_code_hash and c.client_id = p_client_id
      and c.redirect_uri = p_redirect_uri and c.challenge = p_challenge
      and c.resource = p_resource and c.expires_at > now()
    returning c.user_id, c.client_id, c.resource, c.scope
  ), issued as (
    insert into public.mcp_oauth_grants(user_id,client_id,resource,scope,access_hash,refresh_hash,access_expires_at,refresh_expires_at)
    select c.user_id,c.client_id,c.resource,c.scope,p_access_hash,p_new_refresh_hash,now()+interval '1 hour',now()+interval '30 days'
    from consumed c returning mcp_oauth_grants.scope
  ) select issued.scope from issued;
$$;

-- UPDATE rechecks the old refresh hash after acquiring the row lock. Only one
-- concurrent request wins; old access and refresh tokens stop working immediately.
-- Absolute refresh expiry is not extended, bounding the consent lifetime to 30 days.
create function public.mcp_oauth_rotate_refresh(
  p_client_id text, p_resource text, p_access_hash text, p_new_refresh_hash text,
  p_refresh_hash text
) returns table (scope text)
language sql security invoker set search_path = '' as $$
  update public.mcp_oauth_grants g
  set access_hash = p_access_hash, refresh_hash = p_new_refresh_hash,
      access_expires_at = least(now()+interval '1 hour', g.refresh_expires_at)
  where g.refresh_hash = p_refresh_hash and g.client_id = p_client_id
    and g.resource = p_resource and g.revoked_at is null and g.refresh_expires_at > now()
  returning g.scope;
$$;

-- Durable cap survives serverless instance churn and spoofed request IPs.
-- A serial advisory lock ensures concurrent public registrations cannot exceed it.
create function public.mcp_oauth_register_client(p_client_id text,p_client_name text,p_redirect_uris jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(76431209162026);
  if (select count(*) from public.mcp_oauth_clients where created_at > now()-interval '1 hour') >= 200
    or (select count(*) from public.mcp_oauth_clients) >= 10000 then
    return false;
  end if;
  insert into public.mcp_oauth_clients(client_id,client_name,redirect_uris) values(p_client_id,p_client_name,p_redirect_uris);
  return true;
end;
$$;

revoke all on function public.mcp_oauth_exchange_code(text,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.mcp_oauth_rotate_refresh(text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.mcp_oauth_register_client(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.mcp_oauth_exchange_code(text,text,text,text,text,text,text) to service_role;
grant execute on function public.mcp_oauth_rotate_refresh(text,text,text,text,text) to service_role;
grant execute on function public.mcp_oauth_register_client(text,text,jsonb) to service_role;
commit;
