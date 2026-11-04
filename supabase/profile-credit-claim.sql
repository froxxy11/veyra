alter table public.veyra_accounts add column funding_attempt jsonb;
create function public.veyra_claim_credits(owner uuid) returns jsonb language plpgsql set search_path='' as $$
declare result jsonb;
begin
 select funding_attempt into result from public.veyra_accounts where id=owner for update;
 if not found then raise exception 'Account not found'; end if;
 if result is null then
  result:=jsonb_build_object('id',gen_random_uuid(),'started',floor(extract(epoch from now())*1000),'status','active','cash',10000,'equity',10000,'peak',10000,'dayStart',10000,'positions','[]'::jsonb,'settled','[]'::jsonb,'days','[]'::jsonb,'reason',null);
  update public.veyra_accounts set funding_attempt=result where id=owner;
 end if;
 return result;
end $$;
revoke all on function public.veyra_claim_credits(uuid) from public,anon,authenticated;
grant execute on function public.veyra_claim_credits(uuid) to service_role;
