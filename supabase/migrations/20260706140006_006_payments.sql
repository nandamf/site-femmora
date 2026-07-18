-- Depends on 005_orders. Provider-neutral; no Mercado Pago integration is included.

create type public.payment_status as enum (
  'pending', 'authorized', 'approved', 'rejected',
  'cancelled', 'refunded', 'partially_refunded', 'failed'
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  provider text not null,
  provider_payment_id text,
  provider_reference_id text,
  status public.payment_status not null default 'pending',
  amount bigint not null,
  refunded_amount bigint not null default 0,
  currency text not null default 'BRL',
  payment_method text,
  installments integer,
  idempotency_key text not null unique,
  failure_code text,
  approved_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint payments_provider_check check (provider ~ '^[a-z][a-z0-9_]*$'),
  constraint payments_amount_check check (amount > 0),
  constraint payments_refund_check check (refunded_amount >= 0 and refunded_amount <= amount),
  constraint payments_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint payments_installments_check check (installments is null or installments > 0),
  constraint payments_approval_check check (status <> 'approved' or approved_at is not null)
);

create trigger payments_set_updated_at before update on public.payments
for each row execute function app_private.set_updated_at();

comment on table public.payments is
  'Provider-neutral payment attempts. Provider credentials and raw sensitive payloads never belong here.';
