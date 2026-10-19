-- CRM Family - PDV Central / multiempresa - 2026-10-19
--
-- Objetivo:
-- O operador autenticado pela empresa Schemmer Cell pode usar o mesmo /caixa
-- para vender por qualquer empresa ativa do CRM Family, mantendo estoque,
-- financeiro, clientes, sessões e vendas separados pelo company_id de destino.
--
-- Execute depois de:
--   supabase/pdv-2026-08-22.sql
--   supabase/pdv-service-sale-2026-09-01.sql

-- Compatibilidade com a busca por código interno da Sedux.
alter table public.products
  add column if not exists product_code text;

create unique index if not exists products_company_product_code_uidx
  on public.products (company_id, lower(product_code))
  where product_code is not null and btrim(product_code) <> '';

-- ---------------------------------------------------------------------------
-- 1. Identifica operadores autorizados a usar o PDV Central.
-- ---------------------------------------------------------------------------

create or replace function public.pos_hub_operator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.companies c on c.id = p.company_id
    where p.id = auth.uid()
      and p.is_active = true
      and c.is_active = true
      and p.role in ('cashier','store_admin','store_user')
      and (
        lower(c.slug) in ('schemmer-cell','loja-celular')
        or lower(c.name) like '%schemmer%'
      )
  );
$$;

revoke all on function public.pos_hub_operator() from public, anon;
grant execute on function public.pos_hub_operator() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Permite leitura multiempresa apenas ao operador do PDV Central.
-- As políticas atuais continuam valendo para cada empresa normalmente.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'companies',
    'customers',
    'products',
    'product_variants',
    'bundles',
    'device_units',
    'service_orders',
    'pets',
    'pet_appointments',
    'cash_sessions',
    'cash_movements',
    'sale_payments',
    'sales',
    'sale_items',
    'sale_item_components'
  ]
  loop
    execute format('drop policy if exists pos_hub_select on public.%I', t);
    execute format(
      'create policy pos_hub_select on public.%I for select to authenticated using (public.pos_hub_operator())',
      t
    );
  end loop;
end
$$;

grant select on
  public.companies,
  public.customers,
  public.products,
  public.product_variants,
  public.bundles,
  public.device_units,
  public.service_orders,
  public.pets,
  public.pet_appointments,
  public.cash_sessions,
  public.cash_movements,
  public.sale_payments,
  public.sales,
  public.sale_items,
  public.sale_item_components
to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Troca temporariamente o company_id do JWT somente dentro da transação
-- da RPC do PDV Central. O sub/usuário e o role originais são preservados.
-- ---------------------------------------------------------------------------

create or replace function public.pos_hub_apply_company(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claims jsonb;
  v_app_metadata jsonb;
begin
  if not public.pos_hub_operator() then
    raise exception 'Este operador não possui acesso ao PDV Central';
  end if;

  if not exists (
    select 1
    from public.companies
    where id = p_company_id
      and is_active = true
  ) then
    raise exception 'Empresa inválida ou inativa';
  end if;

  v_claims := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb,
    '{}'::jsonb
  );

  v_app_metadata :=
    coalesce(v_claims -> 'app_metadata', '{}'::jsonb)
    || jsonb_build_object('company_id', p_company_id::text);

  v_claims := v_claims || jsonb_build_object('app_metadata', v_app_metadata);

  perform set_config('request.jwt.claims', v_claims::text, true);
end;
$$;

revoke all on function public.pos_hub_apply_company(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Wrappers seguros para as operações de escrita.
-- Eles reutilizam as RPCs atuais do PDV, sem duplicar a regra de negócio.
-- ---------------------------------------------------------------------------

create or replace function public.pos_hub_open_cash_session(
  p_company_id uuid,
  p_opening_amount numeric default 0,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.pos_hub_operator() then
    raise exception 'Este operador não possui acesso ao PDV Central';
  end if;

  perform public.pos_hub_apply_company(p_company_id);

  return public.open_cash_session(
    p_opening_amount,
    p_notes
  );
end;
$$;

create or replace function public.pos_hub_add_cash_movement(
  p_company_id uuid,
  p_cash_session_id uuid,
  p_movement_type text,
  p_amount numeric,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.pos_hub_operator() then
    raise exception 'Este operador não possui acesso ao PDV Central';
  end if;

  perform public.pos_hub_apply_company(p_company_id);

  return public.add_cash_movement(
    p_cash_session_id,
    p_movement_type,
    p_amount,
    p_description
  );
end;
$$;

create or replace function public.pos_hub_close_cash_session(
  p_company_id uuid,
  p_cash_session_id uuid,
  p_closing_amount numeric,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.pos_hub_operator() then
    raise exception 'Este operador não possui acesso ao PDV Central';
  end if;

  perform public.pos_hub_apply_company(p_company_id);

  return public.close_cash_session(
    p_cash_session_id,
    p_closing_amount,
    p_notes
  );
end;
$$;

create or replace function public.pos_hub_create_sale(
  p_company_id uuid,
  p_cash_session_id uuid,
  p_customer_id uuid,
  p_discount numeric,
  p_due_date date,
  p_items jsonb,
  p_payments jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.pos_hub_operator() then
    raise exception 'Este operador não possui acesso ao PDV Central';
  end if;

  perform public.pos_hub_apply_company(p_company_id);

  return public.create_pos_sale(
    p_cash_session_id,
    p_customer_id,
    p_discount,
    p_due_date,
    p_items,
    p_payments
  );
end;
$$;

create or replace function public.pos_hub_cancel_sale(
  p_company_id uuid,
  p_sale_id uuid,
  p_reason text,
  p_refund_session_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.pos_hub_operator() then
    raise exception 'Este operador não possui acesso ao PDV Central';
  end if;

  perform public.pos_hub_apply_company(p_company_id);

  perform public.cancel_pos_sale(
    p_sale_id,
    p_reason,
    p_refund_session_id
  );
end;
$$;

revoke all on function public.pos_hub_open_cash_session(uuid,numeric,text) from public, anon;
revoke all on function public.pos_hub_add_cash_movement(uuid,uuid,text,numeric,text) from public, anon;
revoke all on function public.pos_hub_close_cash_session(uuid,uuid,numeric,text) from public, anon;
revoke all on function public.pos_hub_create_sale(uuid,uuid,uuid,numeric,date,jsonb,jsonb) from public, anon;
revoke all on function public.pos_hub_cancel_sale(uuid,uuid,text,uuid) from public, anon;

grant execute on function public.pos_hub_open_cash_session(uuid,numeric,text) to authenticated;
grant execute on function public.pos_hub_add_cash_movement(uuid,uuid,text,numeric,text) to authenticated;
grant execute on function public.pos_hub_close_cash_session(uuid,uuid,numeric,text) to authenticated;
grant execute on function public.pos_hub_create_sale(uuid,uuid,uuid,numeric,date,jsonb,jsonb) to authenticated;
grant execute on function public.pos_hub_cancel_sale(uuid,uuid,text,uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Índices úteis para o PDV Central.
-- ---------------------------------------------------------------------------

create index if not exists cash_sessions_company_user_status_idx
  on public.cash_sessions(company_id, opened_by, status);

create index if not exists sales_company_source_date_idx
  on public.sales(company_id, source, sold_at desc);

create index if not exists customers_company_active_name_idx
  on public.customers(company_id, is_active, name);

create index if not exists products_company_active_name_idx
  on public.products(company_id, is_active, name);
