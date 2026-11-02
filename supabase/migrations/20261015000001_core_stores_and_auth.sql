-- Migration: 20261015000001_core_stores_and_auth.sql
-- Description: Core schema for stores, user profiles, staff store access, and RLS security helper.

-- 1. STORES TABLE
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('mobiles', 'furniture-electronics')),
  name text not null,
  gstin text not null,
  state_code text not null default '27',
  legal_name text not null default 'Star Enterprises',
  trade_name text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null default 'Mumbai',
  pincode text not null,
  phone text not null,
  email text not null,
  invoice_prefix text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'cashier' check (role in ('owner', 'manager', 'cashier', 'stock_keeper', 'delivery', 'service_technician')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. STAFF STORE ACCESS TABLE
create table if not exists public.staff_store_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  role text not null check (role in ('manager', 'cashier', 'stock_keeper', 'delivery', 'service_technician')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, store_id)
);

-- Indexes for foreign keys and policy checks
create index if not exists idx_staff_store_access_user on public.staff_store_access(user_id);
create index if not exists idx_staff_store_access_store on public.staff_store_access(store_id);
create index if not exists idx_profiles_role on public.profiles(role);

-- 4. SECURITY DEFINER HELPER FUNCTION
create or replace function public.user_has_store_access(
  p_store_id uuid,
  p_required_roles text[] default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_role text;
begin
  if v_uid is null then
    return false;
  end if;

  -- Global owner check
  select role into v_role from public.profiles where id = v_uid;
  if v_role = 'owner' then
    return true;
  end if;

  -- Store-level staff check
  if p_required_roles is null then
    return exists (
      select 1 from public.staff_store_access
      where user_id = v_uid 
        and store_id = p_store_id 
        and is_active = true
    );
  else
    return exists (
      select 1 from public.staff_store_access
      where user_id = v_uid 
        and store_id = p_store_id 
        and is_active = true
        and role = any(p_required_roles)
    );
  end if;
end;
$$;

grant execute on function public.user_has_store_access(uuid, text[]) to anon, authenticated;

-- Helper to check if current user is owner
create or replace function public.is_owner()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    return false;
  end if;
  return exists (
    select 1 from public.profiles 
    where id = v_uid and role = 'owner'
  );
end;
$$;

grant execute on function public.is_owner() to anon, authenticated;

-- 5. TRIGGER FOR NEW AUTH USERS -> PROFILES
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Staff Member'),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'cashier')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. ROW LEVEL SECURITY POLICIES
alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_store_access enable row level security;

-- Stores policies
create policy "Anyone can view active stores"
  on public.stores for select
  to anon, authenticated
  using (is_active = true);

create policy "Owners can manage stores"
  on public.stores for all
  to authenticated
  using ((select public.is_owner()));

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Owners can view all profiles"
  on public.profiles for select
  to authenticated
  using ((select public.is_owner()));

create policy "Owners can update profiles"
  on public.profiles for update
  to authenticated
  using ((select public.is_owner()));

create policy "Users can update own profile name and phone"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Staff store access policies
create policy "Users can view own store assignments"
  on public.staff_store_access for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can view and manage all staff store access"
  on public.staff_store_access for all
  to authenticated
  using ((select public.is_owner()));

-- 7. SEED INITIAL STORES
insert into public.stores (code, name, gstin, state_code, legal_name, trade_name, address_line1, city, pincode, phone, email, invoice_prefix)
values 
  (
    'mobiles',
    'Star Mobiles',
    '27AAAAA0000A1Z5',
    '27',
    'Star Enterprises',
    'Star Mobiles',
    'Khadka Road, Near Reliance Smart Bazar',
    'Bhusawal',
    '425201',
    '+91 93700 11653',
    'mazharq82@gmail.com',
    'MOB'
  ),
  (
    'furniture-electronics',
    'Star Furniture & Electronics',
    '27AAAAA0000A1Z5',
    '27',
    'Star Enterprises',
    'Star Furniture & Electronics',
    'Khadka Road, Near Reliance Smart Bazar',
    'Bhusawal',
    '425201',
    '+91 93700 11653',
    'mazharq82@gmail.com',
    'FE'
  )
on conflict (code) do nothing;
