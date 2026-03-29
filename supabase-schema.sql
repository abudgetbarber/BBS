-- ═══════════════════════════════════════════════════════════════════
--  BUDGET BARBER — SUPABASE SCHEMA
--  Run this in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. SALONS
create table if not exists salons (
  id          text primary key,
  name        text,
  location    text,
  "mgrPhone"  text
);

-- 2. STAFF  (barbers, managers, franchise owners, admins)
create table if not exists staff (
  id            text primary key,
  name          text,
  phone         text unique,
  role          text,          -- 'barber' | 'manager' | 'franchise' | 'admin'
  "salonId"     text references salons(id),
  "loginPin"    text,
  "fixedSalary" numeric default 0,
  "foodMoney"   numeric default 0,
  "cleaningMoney" numeric default 0
);

-- 3. CUSTOMERS
create table if not exists customers (
  id            text primary key,
  phone         text unique,
  name          text,
  role          text default 'customer',
  "hairType"    text,
  "faceShape"   text,
  density       text,
  "growthNotes" text,
  "loginPin"    text
);

-- 4. ENTRIES  (sales / billing records)
create table if not exists entries (
  id              text primary key,
  date            text,         -- "d/m/yyyy" format (matches app)
  time            text,
  "barberId"      text,
  "barberName"    text,
  "salonId"       text,
  services        text,
  "phPay"         numeric default 0,
  cash            numeric default 0,
  tip             numeric default 0,
  "phTip"         numeric default 0,
  "cashTip"       numeric default 0,
  total           numeric default 0,
  "customerName"  text,
  "customerPhone" text
);

-- 5. CASH IN  (barber cash drawer entries)
create table if not exists cash_in (
  id          bigserial primary key,
  amount      numeric,
  time        text,
  date        text,
  "barberId"  text
);

-- 6. EXPENSES  (barber expense logs)
create table if not exists expenses (
  id          bigserial primary key,
  desc        text,
  amount      numeric,
  time        text,
  date        text,
  "barberId"  text
);

-- 7. ATTENDANCE
create table if not exists attendance (
  id          bigserial primary key,
  type        text,      -- 'in' | 'out' | 'break'
  date        text,
  time        text,
  ts          bigint,
  "barberId"  text
);

-- 8. STYLE CARDS
create table if not exists style_cards (
  id          text primary key,
  "cardId"    text,
  "customerId" text,
  "barberId"  text,
  "salonId"   text,
  name        text,
  "createdAt" text,
  "topLength" text,
  texture     text,
  fade        text,
  guard       text,
  neckline    text,
  beard       text,
  product     text,
  notes       text,
  "zoneFront" text,
  "zoneTop"   text,
  "zoneCrown" text,
  "zoneLeft"  text,
  "zoneRight" text,
  "zoneBack"  text
);

-- 9. VISITS
create table if not exists visits (
  id            text primary key,
  "customerId"  text,
  "barberId"    text,
  "barberName"  text,
  "salonId"     text,
  "salonName"   text,
  "styleName"   text,
  date          text,
  note          text
);

-- 10. ADVANCES
create table if not exists advances (
  id          bigserial primary key,
  date        text,
  amount      numeric,
  "barberId"  text,
  ts          bigint
);

-- 11. MANAGER CASH IN
create table if not exists mgr_cash_in (
  id            bigserial primary key,
  amount        numeric,
  time          text,
  date          text,
  "managerId"   text,
  "salonId"     text
);

-- 12. MANAGER EXPENSES
create table if not exists mgr_expenses (
  id            bigserial primary key,
  desc          text,
  amount        numeric,
  time          text,
  date          text,
  "managerId"   text,
  "salonId"     text
);

-- 13. DEDUCTIONS
create table if not exists deductions (
  id          bigserial primary key,
  staff_id    text,
  month       text,      -- "yyyy-mm"
  desc        text,
  amount      numeric
);

-- 14. ATTENDANCE OVERRIDES
create table if not exists att_overrides (
  id          bigserial primary key,
  staff_id    text,
  month       text,      -- "yyyy-mm"
  present     integer default 0,
  half        integer default 0,
  absent      integer default 0
);

-- ═══════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
--  Enable RLS on all tables, then allow anon read+write
--  (adjust per your security needs)
-- ═══════════════════════════════════════════════════════

alter table salons       enable row level security;
alter table staff        enable row level security;
alter table customers    enable row level security;
alter table entries      enable row level security;
alter table cash_in      enable row level security;
alter table expenses     enable row level security;
alter table attendance   enable row level security;
alter table style_cards  enable row level security;
alter table visits       enable row level security;
alter table advances     enable row level security;
alter table mgr_cash_in  enable row level security;
alter table mgr_expenses enable row level security;
alter table deductions   enable row level security;
alter table att_overrides enable row level security;

-- Allow anon role full access (app uses anon key)
-- ⚠️  For production: tighten these policies per role
do $$
declare
  tbls text[] := array[
    'salons','staff','customers','entries','cash_in','expenses',
    'attendance','style_cards','visits','advances',
    'mgr_cash_in','mgr_expenses','deductions','att_overrides'
  ];
  t text;
begin
  foreach t in array tbls loop
    execute format('
      create policy "anon_all_%s" on %I
      for all to anon using (true) with check (true);
    ', t, t);
  end loop;
end $$;

