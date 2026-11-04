create table public.veyra_accounts(id uuid primary key default gen_random_uuid(), auth_user_id uuid unique references auth.users(id), display_name text not null default 'Trader', bio text not null default '', created_at timestamptz not null default now());
create table public.veyra_wallets(account_id text primary key, owner_id uuid not null references public.veyra_accounts(id), created_at timestamptz not null default now());
create table public.veyra_sessions(token_hash text primary key, owner_id uuid not null references public.veyra_accounts(id), created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '8 hours');
create table public.veyra_challenges(id uuid primary key default gen_random_uuid(), nonce text not null, browser_hash text not null, ip_hash text not null, owner_id uuid references public.veyra_accounts(id), message text not null, created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '5 minutes');
alter table public.veyra_accounts enable row level security;
alter table public.veyra_wallets enable row level security;
alter table public.veyra_sessions enable row level security;
alter table public.veyra_challenges enable row level security;
revoke all on public.veyra_accounts,public.veyra_wallets,public.veyra_sessions,public.veyra_challenges from anon,authenticated;
create index on public.veyra_challenges(ip_hash,created_at);
create index on public.veyra_sessions(owner_id);
create index on public.veyra_wallets(owner_id);
-- Only the authenticated server can call these transactional identity operations.
create function public.veyra_email_login(uid uuid, linked_owner uuid, new_hash text) returns uuid language plpgsql set search_path='' as $$
declare target uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select id into target from public.veyra_accounts where auth_user_id=uid;
 if linked_owner is not null then
  if target is not null and target<>linked_owner then raise exception 'This email already belongs to another Veyra account. Account merging is not automatic.'; end if;
  update public.veyra_accounts set auth_user_id=uid where id=linked_owner and (auth_user_id is null or auth_user_id=uid);
  if not found then raise exception 'This account already has a different email.'; end if;
  target:=linked_owner;
 elsif target is null then insert into public.veyra_accounts(auth_user_id) values(uid) returning id into target;
 end if;
 insert into public.veyra_sessions(token_hash,owner_id) values(new_hash,target);
 return target;
end $$;
create function public.veyra_wallet_login(challenge_id uuid, proof_hash text, wallet_id text, new_hash text) returns uuid language plpgsql set search_path='' as $$
declare c public.veyra_challenges; target uuid;
begin
 delete from public.veyra_challenges where id=challenge_id and browser_hash=proof_hash and expires_at>now() returning * into c;
 if c.id is null then raise exception 'Challenge expired or already used.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(wallet_id,0));
 select owner_id into target from public.veyra_wallets where account_id=wallet_id;
 if c.owner_id is not null then
  if target is not null and target<>c.owner_id then raise exception 'Wallet already linked to another account. Sign in to that account; merging is not automatic.'; end if;
  target:=c.owner_id;
 elsif target is null then insert into public.veyra_accounts(display_name) values(left(wallet_id,40)) returning id into target;
 end if;
 insert into public.veyra_wallets(account_id,owner_id) values(wallet_id,target) on conflict do nothing;
 insert into public.veyra_sessions(token_hash,owner_id) values(new_hash,target);
 return target;
end $$;
revoke all on function public.veyra_email_login(uuid,uuid,text),public.veyra_wallet_login(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.veyra_email_login(uuid,uuid,text),public.veyra_wallet_login(uuid,text,text,text) to service_role;
