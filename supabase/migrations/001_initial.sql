-- SnapSpend schema — run in Supabase SQL Editor (Dashboard → SQL → New query)

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Alex',
  email text unique,
  employment text not null default '1099',
  industry text not null default 'Creator/Photographer',
  state text not null default 'California',
  deductions jsonb not null default '["camera","software","office"]'::jsonb,
  auth_provider text,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  vendor text not null,
  category text not null,
  amount numeric(12,2) not null,
  deductible boolean not null default true,
  type text not null default 'other',
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists mileage_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  from_place text not null,
  to_place text not null,
  miles numeric(8,2) not null,
  duration_min int not null default 0,
  purpose text not null default 'Business',
  status text not null default 'active',
  trip_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mood text not null default 'happy',
  title text not null,
  sub text not null default '',
  time_label text not null default 'now',
  read boolean not null default false,
  mint boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_id_idx on expenses(user_id);
create index if not exists mileage_trips_user_id_idx on mileage_trips(user_id);
create index if not exists notifications_user_id_idx on notifications(user_id);

alter table profiles enable row level security;
alter table expenses enable row level security;
alter table mileage_trips enable row level security;
alter table notifications enable row level security;

-- API uses service role key; RLS optional for direct client access later.
