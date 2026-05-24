-- Allow link_customer_auth_user to fix mislinked auth_user_id when emails match.

create or replace function public.link_customer_auth_user()
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_email text;
  v_customer_id uuid;
begin
  if auth.uid() is null then
    return null;
  end if;

  select email into v_email from auth.users where id = auth.uid();
  if v_email is null or v_email = '' then
    return null;
  end if;

  select id into v_customer_id
  from public.customers
  where lower(email) = lower(v_email)
  limit 1;

  if v_customer_id is null then
    return null;
  end if;

  update public.customers
  set auth_user_id = auth.uid()
  where id = v_customer_id
    and lower(email) = lower(v_email);

  return v_customer_id;
end;
$$;

notify pgrst, 'reload schema';
