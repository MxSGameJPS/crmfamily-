-- CRM Family - código interno de produto (Sedux) - 2026-10-15
-- Adiciona um código interno opcional aos produtos e garante unicidade por empresa.

alter table public.products
  add column if not exists product_code text;

create unique index if not exists products_company_product_code_uidx
  on public.products (company_id, lower(product_code))
  where product_code is not null and btrim(product_code) <> '';
