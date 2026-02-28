-- Add Salla order metadata to activation_codes
-- These columns are nullable for backwards compatibility with manually-created codes

alter table public.activation_codes
  add column if not exists salla_order_id text,
  add column if not exists customer_email text,
  add column if not exists customer_name text,
  add column if not exists salla_product_id text;

create index if not exists idx_activation_codes_salla_order_id
  on public.activation_codes(salla_order_id);

create index if not exists idx_activation_codes_customer_email
  on public.activation_codes(customer_email);
