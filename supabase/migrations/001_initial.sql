-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'driver' check (role in ('admin', 'driver')),
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by authenticated users"
  on public.profiles for select using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Agencies
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  commission_pct numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.agencies enable row level security;

create policy "Agencies viewable by authenticated"
  on public.agencies for select using (auth.role() = 'authenticated');

create policy "Admins manage agencies"
  on public.agencies for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  document text,
  notes text,
  agency_id uuid references public.agencies(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Clients viewable by authenticated"
  on public.clients for select using (auth.role() = 'authenticated');

create policy "Admins manage clients"
  on public.clients for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Drivers
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  phone text,
  license_plate text,
  vehicle_model text,
  pix_key text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.drivers enable row level security;

create policy "Drivers viewable by authenticated"
  on public.drivers for select using (auth.role() = 'authenticated');

create policy "Admins manage drivers"
  on public.drivers for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Rides
create table public.rides (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  agency_id uuid references public.agencies(id) on delete set null,
  origin text not null,
  destination text not null,
  scheduled_at timestamptz not null,
  pax_count integer not null default 1,
  price numeric(10,2) not null default 0,
  currency text not null default 'BRL' check (currency in ('BRL', 'USD', 'EUR')),
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  financial_status text not null default 'pending' check (financial_status in ('pending', 'awaiting_approval', 'awaiting_payment', 'invoiced', 'in_progress', 'completed', 'paid_to_partner')),
  notes text,
  started_at timestamptz,
  finished_at timestamptz,
  nf_number text,
  created_at timestamptz not null default now()
);

alter table public.rides enable row level security;

create policy "Admins see all rides"
  on public.rides for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Drivers see own rides"
  on public.rides for select using (
    driver_id in (select d.id from public.drivers d where d.profile_id = auth.uid())
  );

create policy "Admins manage rides"
  on public.rides for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Drivers update own rides"
  on public.rides for update using (
    driver_id in (select d.id from public.drivers d where d.profile_id = auth.uid())
  ) with check (
    driver_id in (select d.id from public.drivers d where d.profile_id = auth.uid())
  );

-- Indexes
create index idx_rides_scheduled_at on public.rides (scheduled_at);
create index idx_rides_driver_id on public.rides (driver_id);
create index idx_rides_status on public.rides (status);
create index idx_clients_agency_id on public.clients (agency_id);
