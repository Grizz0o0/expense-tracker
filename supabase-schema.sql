-- ==============================================================================
-- EXPENSE TRACKER - SUPABASE DATABASE SCHEMA
-- Bảng và chính sách bảo mật Row Level Security (RLS)
-- Chạy toàn bộ script này trong mục Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. BẢNG GIAO DỊCH (TRANSACTIONS)
create table if not exists public.transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    amount numeric(15, 2) not null check (amount > 0),
    type varchar(10) not null check (type in ('expense', 'income')),
    category varchar(100) not null,
    category_icon varchar(10) default '💰',
    note text,
    transaction_date date default current_date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Kích hoạt RLS cho transactions
alter table public.transactions enable row level security;

-- Policies bảo mật cho transactions
create policy "Users can view own transactions"
    on public.transactions for select
    using (auth.uid() = user_id);

create policy "Users can insert own transactions"
    on public.transactions for insert
    with check (auth.uid() = user_id);

create policy "Users can update own transactions"
    on public.transactions for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own transactions"
    on public.transactions for delete
    using (auth.uid() = user_id);

-- Chỉ mục tối ưu tốc độ truy vấn
create index if not exists idx_transactions_user_date 
    on public.transactions (user_id, transaction_date desc);

create index if not exists idx_transactions_user_type 
    on public.transactions (user_id, type);

-- ------------------------------------------------------------------------------
-- 2. BẢNG NGÂN SÁCH (BUDGETS) - PHASE 2
-- ------------------------------------------------------------------------------
create table if not exists public.budgets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    category varchar(100) not null, -- 'all' hoặc tên danh mục cụ thể
    amount numeric(15, 2) not null check (amount > 0),
    month int not null check (month between 1 and 12),
    year int not null check (year >= 2024),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, category, month, year)
);

alter table public.budgets enable row level security;

create policy "Users can view own budgets"
    on public.budgets for select
    using (auth.uid() = user_id);

create policy "Users can insert own budgets"
    on public.budgets for insert
    with check (auth.uid() = user_id);

create policy "Users can update own budgets"
    on public.budgets for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own budgets"
    on public.budgets for delete
    using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. BẢNG DANH MỤC TÙY CHỈNH (CUSTOM CATEGORIES) - PHASE 2
-- ------------------------------------------------------------------------------
create table if not exists public.custom_categories (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name varchar(100) not null,
    icon varchar(10) default '🏷️',
    color varchar(20) default '#6366f1',
    type varchar(10) not null check (type in ('expense', 'income')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, name, type)
);

alter table public.custom_categories enable row level security;

create policy "Users can view own custom categories"
    on public.custom_categories for select
    using (auth.uid() = user_id);

create policy "Users can insert own custom categories"
    on public.custom_categories for insert
    with check (auth.uid() = user_id);

create policy "Users can update own custom categories"
    on public.custom_categories for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own custom categories"
    on public.custom_categories for delete
    using (auth.uid() = user_id);
