alter table public.veyra_accounts add column contact_method text not null default '', add column contact_value text not null default '', add column contact_public boolean not null default false;
