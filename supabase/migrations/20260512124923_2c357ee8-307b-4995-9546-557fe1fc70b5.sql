
create table public.wifi_vendors (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  landlord_id uuid not null,
  name text not null,
  plan_name text,
  speed_mbps integer,
  monthly_price_kes integer not null default 0,
  contact_phone text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now()
);
create index on public.wifi_vendors(property_id);
alter table public.wifi_vendors enable row level security;

create policy "Wifi vendors viewable by all" on public.wifi_vendors for select using (true);
create policy "Landlord insert own wifi vendors" on public.wifi_vendors for insert
  with check (auth.uid() = landlord_id and landlord_id in (select landlord_id from public.properties where id = property_id));
create policy "Landlord update own wifi vendors" on public.wifi_vendors for update using (auth.uid() = landlord_id);
create policy "Landlord delete own wifi vendors" on public.wifi_vendors for delete using (auth.uid() = landlord_id);

create table public.wifi_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  landlord_id uuid not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  vendor_id uuid references public.wifi_vendors(id) on delete set null,
  vendor_name text not null,
  amount_kes integer not null,
  period_month date not null,
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.wifi_payments(tenant_id);
create index on public.wifi_payments(landlord_id);
alter table public.wifi_payments enable row level security;

create policy "Wifi pay tenant insert" on public.wifi_payments for insert with check (auth.uid() = tenant_id);
create policy "Wifi pay tenant update" on public.wifi_payments for update using (auth.uid() = tenant_id);
create policy "Wifi pay select" on public.wifi_payments for select using (auth.uid() = tenant_id or auth.uid() = landlord_id);
