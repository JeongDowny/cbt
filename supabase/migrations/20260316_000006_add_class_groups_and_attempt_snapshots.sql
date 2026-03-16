begin;

create extension if not exists pgcrypto;

create table if not exists public.class_years (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique check (year >= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_names (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_cohorts (
  id uuid primary key default gen_random_uuid(),
  cohort_no smallint not null unique check (cohort_no >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_groups (
  id uuid primary key default gen_random_uuid(),
  class_year_id uuid not null references public.class_years(id) on delete restrict,
  class_name_id uuid not null references public.class_names(id) on delete restrict,
  class_cohort_id uuid not null references public.class_cohorts(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_year_id, class_name_id, class_cohort_id)
);

create index if not exists idx_class_groups_year
  on public.class_groups (class_year_id);

create index if not exists idx_class_groups_name
  on public.class_groups (class_name_id);

create index if not exists idx_class_groups_cohort
  on public.class_groups (class_cohort_id);

alter table public.attempts
  add column if not exists class_group_id uuid references public.class_groups(id) on delete restrict;

alter table public.attempts
  add column if not exists class_year_snapshot integer;

alter table public.attempts
  add column if not exists class_name_snapshot text;

alter table public.attempts
  add column if not exists cohort_no_snapshot smallint;

alter table public.attempts
  alter column birth_date drop not null;

drop index if exists idx_attempts_user_lookup;

create index if not exists idx_attempts_class_lookup
  on public.attempts (class_group_id, user_name, created_at desc);

create index if not exists idx_attempts_class_snapshot_lookup
  on public.attempts (class_year_snapshot, class_name_snapshot, cohort_no_snapshot, user_name, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_class_years_set_updated_at on public.class_years;
create trigger trg_class_years_set_updated_at
before update on public.class_years
for each row execute function public.set_updated_at();

drop trigger if exists trg_class_names_set_updated_at on public.class_names;
create trigger trg_class_names_set_updated_at
before update on public.class_names
for each row execute function public.set_updated_at();

drop trigger if exists trg_class_cohorts_set_updated_at on public.class_cohorts;
create trigger trg_class_cohorts_set_updated_at
before update on public.class_cohorts
for each row execute function public.set_updated_at();

drop trigger if exists trg_class_groups_set_updated_at on public.class_groups;
create trigger trg_class_groups_set_updated_at
before update on public.class_groups
for each row execute function public.set_updated_at();

create or replace function public.set_attempt_class_snapshot()
returns trigger
language plpgsql
as $$
declare
  v_year integer;
  v_class_name text;
  v_cohort_no smallint;
begin
  if new.class_group_id is null then
    return new;
  end if;

  select cy.year, cn.name, cc.cohort_no
    into v_year, v_class_name, v_cohort_no
  from public.class_groups cg
  join public.class_years cy on cy.id = cg.class_year_id
  join public.class_names cn on cn.id = cg.class_name_id
  join public.class_cohorts cc on cc.id = cg.class_cohort_id
  where cg.id = new.class_group_id;

  if v_year is null or v_class_name is null or v_cohort_no is null then
    raise exception 'class_group_not_found: %', new.class_group_id;
  end if;

  new.class_year_snapshot := v_year;
  new.class_name_snapshot := v_class_name;
  new.cohort_no_snapshot := v_cohort_no;

  return new;
end;
$$;

drop trigger if exists trg_set_attempt_class_snapshot on public.attempts;
create trigger trg_set_attempt_class_snapshot
before insert or update of class_group_id
on public.attempts
for each row execute function public.set_attempt_class_snapshot();

commit;
