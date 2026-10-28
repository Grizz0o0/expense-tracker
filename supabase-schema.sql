-- ==============================================================================
-- EXPENSE TRACKER - SUPABASE DATABASE SCHEMA
-- Bảng và chính sách bảo mật Row Level Security (RLS)
-- Chạy toàn bộ script này trong mục Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BẢNG VÍ TIỀN / TÀI KHOẢN (WALLETS)
-- ------------------------------------------------------------------------------
create table if not exists public.wallets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name varchar(100) not null,
    type varchar(30) default 'cash' not null check (type in ('cash', 'bank', 'e_wallet', 'credit', 'savings', 'other')),
    balance numeric(15, 2) default 0 not null,
    color varchar(30) default '#10b981',
    icon varchar(10) default '💵',
    is_default boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wallets enable row level security;

create policy "Users can view own wallets"
    on public.wallets for select
    using (auth.uid() = user_id);

create policy "Users can insert own wallets"
    on public.wallets for insert
    with check (auth.uid() = user_id);

create policy "Users can update own wallets"
    on public.wallets for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own wallets"
    on public.wallets for delete
    using (auth.uid() = user_id);

create index if not exists idx_wallets_user 
    on public.wallets (user_id);

-- ------------------------------------------------------------------------------
-- 2. BẢNG GIAO DỊCH (TRANSACTIONS)
-- ------------------------------------------------------------------------------
create table if not exists public.transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    amount numeric(15, 2) not null check (amount > 0),
    type varchar(10) not null check (type in ('expense', 'income', 'transfer')),
    category varchar(100) not null,
    category_icon varchar(10) default '💰',
    note text,
    transaction_date date default current_date not null,
    wallet_id uuid references public.wallets(id) on delete set null,
    to_wallet_id uuid references public.wallets(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cập nhật ràng buộc và cột nếu bảng đã tồn tại từ trước
do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'transactions' and column_name = 'wallet_id') then
        alter table public.transactions add column wallet_id uuid references public.wallets(id) on delete set null;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'transactions' and column_name = 'to_wallet_id') then
        alter table public.transactions add column to_wallet_id uuid references public.wallets(id) on delete set null;
    end if;
end $$;

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (type in ('expense', 'income', 'transfer'));

alter table public.transactions enable row level security;

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

create index if not exists idx_transactions_user_date 
    on public.transactions (user_id, transaction_date desc);

create index if not exists idx_transactions_user_type 
    on public.transactions (user_id, type);

create index if not exists idx_transactions_user_wallet 
    on public.transactions (user_id, wallet_id);

-- ------------------------------------------------------------------------------
-- 3. BẢNG SỔ VAY - NỢ (DEBTS) & LỊCH SỬ THANH TOÁN (DEBT_LOGS)
-- ------------------------------------------------------------------------------
create table if not exists public.debts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    person_name varchar(150) not null,
    type varchar(20) not null check (type in ('lend', 'borrow')),
    initial_amount numeric(15, 2) not null check (initial_amount > 0),
    paid_amount numeric(15, 2) default 0 not null check (paid_amount >= 0),
    due_date date,
    status varchar(20) default 'open' not null check (status in ('open', 'partial', 'settled')),
    wallet_id uuid references public.wallets(id) on delete set null,
    note text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.debts enable row level security;

create policy "Users can view own debts"
    on public.debts for select
    using (auth.uid() = user_id);

create policy "Users can insert own debts"
    on public.debts for insert
    with check (auth.uid() = user_id);

create policy "Users can update own debts"
    on public.debts for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own debts"
    on public.debts for delete
    using (auth.uid() = user_id);

create index if not exists idx_debts_user_status 
    on public.debts (user_id, status);

create table if not exists public.debt_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    debt_id uuid references public.debts(id) on delete cascade not null,
    amount numeric(15, 2) not null check (amount > 0),
    paid_date date default current_date not null,
    wallet_id uuid references public.wallets(id) on delete set null,
    note text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.debt_logs enable row level security;

create policy "Users can view own debt logs"
    on public.debt_logs for select
    using (auth.uid() = user_id);

create policy "Users can insert own debt logs"
    on public.debt_logs for insert
    with check (auth.uid() = user_id);

create policy "Users can delete own debt logs"
    on public.debt_logs for delete
    using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. BẢNG GIAO DỊCH ĐỊNH KỲ / THUÊ BAO (RECURRING_TRANSACTIONS)
-- ------------------------------------------------------------------------------
create table if not exists public.recurring_transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title varchar(150) not null,
    amount numeric(15, 2) not null check (amount > 0),
    type varchar(10) default 'expense' not null check (type in ('expense', 'income')),
    category varchar(100) not null,
    category_icon varchar(10) default '🔄',
    wallet_id uuid references public.wallets(id) on delete set null,
    frequency varchar(20) default 'monthly' not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
    next_run_date date default current_date not null,
    is_active boolean default true not null,
    note text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.recurring_transactions enable row level security;

create policy "Users can view own recurring transactions"
    on public.recurring_transactions for select
    using (auth.uid() = user_id);

create policy "Users can insert own recurring transactions"
    on public.recurring_transactions for insert
    with check (auth.uid() = user_id);

create policy "Users can update own recurring transactions"
    on public.recurring_transactions for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own recurring transactions"
    on public.recurring_transactions for delete
    using (auth.uid() = user_id);

create index if not exists idx_recurring_user_date 
    on public.recurring_transactions (user_id, next_run_date);

-- ------------------------------------------------------------------------------
-- 5. BẢNG LIÊN KẾT BOT TELEGRAM (TELEGRAM_USER_LINKS)
-- ------------------------------------------------------------------------------
create table if not exists public.telegram_user_links (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    telegram_chat_id varchar(100) not null,
    telegram_username varchar(100),
    connect_code varchar(20) not null,
    is_active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(telegram_chat_id)
);

alter table public.telegram_user_links enable row level security;

create policy "Users can view own telegram link"
    on public.telegram_user_links for select
    using (auth.uid() = user_id);

create policy "Users can insert own telegram link"
    on public.telegram_user_links for insert
    with check (auth.uid() = user_id);

create policy "Users can update own telegram link"
    on public.telegram_user_links for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own telegram link"
    on public.telegram_user_links for delete
    using (auth.uid() = user_id);

create index if not exists idx_telegram_chat_id 
    on public.telegram_user_links (telegram_chat_id);

-- ------------------------------------------------------------------------------
-- 6. BẢNG NGÂN SÁCH (BUDGETS)
-- ------------------------------------------------------------------------------
create table if not exists public.budgets (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    category varchar(100) not null,
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
-- 7. BẢNG DANH MỤC TÙY CHỈNH (CUSTOM CATEGORIES)
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
