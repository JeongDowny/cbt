create extension if not exists pgcrypto;

-- =========================================================
-- 1. certifications
-- =========================================================
create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 2. exams
-- =========================================================
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  certification_id uuid not null references public.certifications(id) on delete restrict,
  exam_year integer not null check (exam_year >= 2000),
  exam_round smallint not null check (exam_round >= 1),
  title text generated always as (exam_year::text || '년 ' || exam_round::text || '회차') stored,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (certification_id, exam_year, exam_round)
);

create index if not exists idx_exams_certification
  on public.exams (certification_id);

create index if not exists idx_exams_status
  on public.exams (status, is_public);

-- =========================================================
-- 3. exam_subjects
-- =========================================================
create table if not exists public.exam_subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  subject_order smallint not null check (subject_order >= 1),
  name text not null,
  time_limit_minutes integer not null default 30 check (time_limit_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, subject_order),
  unique (exam_id, name)
);

create index if not exists idx_exam_subjects_exam
  on public.exam_subjects (exam_id, subject_order);

-- =========================================================
-- 4. questions
-- =========================================================
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_subject_id uuid not null references public.exam_subjects(id) on delete cascade,
  question_no smallint not null check (question_no >= 1),
  stem text not null,
  choice_1 text not null,
  choice_2 text not null,
  choice_3 text not null,
  choice_4 text not null,
  correct_answer smallint not null check (correct_answer between 1 and 4),
  explanation text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_subject_id, question_no)
);

create index if not exists idx_questions_subject
  on public.questions (exam_subject_id, question_no);

-- =========================================================
-- 5. question_images
-- =========================================================
create table if not exists public.question_images (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  image_order smallint not null check (image_order >= 1),
  image_path text not null,
  created_at timestamptz not null default now(),
  unique (question_id, image_order)
);

create index if not exists idx_question_images_question
  on public.question_images (question_id, image_order);

-- =========================================================
-- 6. attempts
-- =========================================================
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete restrict,

  user_name text not null,
  birth_date date not null,

  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'submitted', 'cancelled')),

  total_score numeric(5,2) not null default 0 check (total_score between 0 and 100),
  passed boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_attempts_exam
  on public.attempts (exam_id, created_at desc);

create index if not exists idx_attempts_user_lookup
  on public.attempts (user_name, birth_date, created_at desc);

create index if not exists idx_attempts_status
  on public.attempts (status, created_at desc);

-- =========================================================
-- 7. attempt_subjects
-- =========================================================
create table if not exists public.attempt_subjects (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  exam_subject_id uuid not null references public.exam_subjects(id) on delete restrict,

  subject_name_snapshot text not null,

  started_at timestamptz,
  ended_at timestamptz,
  submitted_at timestamptz,

  score numeric(5,2) not null default 0 check (score between 0 and 100),
  passed boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (attempt_id, exam_subject_id)
);

create index if not exists idx_attempt_subjects_attempt
  on public.attempt_subjects (attempt_id);

create index if not exists idx_attempt_subjects_exam_subject
  on public.attempt_subjects (exam_subject_id);

-- =========================================================
-- 8. attempt_answers
-- =========================================================
create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),

  attempt_subject_id uuid not null references public.attempt_subjects(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,

  question_no smallint not null check (question_no >= 1),

  subject_name_snapshot text not null,
  stem_snapshot text not null,
  choice_1_snapshot text not null,
  choice_2_snapshot text not null,
  choice_3_snapshot text not null,
  choice_4_snapshot text not null,
  correct_answer_snapshot smallint not null check (correct_answer_snapshot between 1 and 4),
  explanation_snapshot text not null default '',
  image_paths_snapshot jsonb not null default '[]'::jsonb,

  selected_answer smallint check (selected_answer between 1 and 4),
  is_correct boolean not null default false,

  answered_at timestamptz,
  created_at timestamptz not null default now(),

  unique (attempt_subject_id, question_no)
);

create index if not exists idx_attempt_answers_attempt_subject
  on public.attempt_answers (attempt_subject_id, question_no);

create index if not exists idx_attempt_answers_question
  on public.attempt_answers (question_id);

-- =========================================================
-- 9. attempt_deletion_logs
-- =========================================================
create table if not exists public.attempt_deletion_logs (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null,
  deleted_at timestamptz not null default now(),
  deleted_by text,
  reason text,
  attempt_snapshot jsonb not null
);

create index if not exists idx_attempt_deletion_logs_attempt
  on public.attempt_deletion_logs (attempt_id, deleted_at desc);

-- =========================================================
-- updated_at helper
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_certifications_set_updated_at on public.certifications;
create trigger trg_certifications_set_updated_at
before update on public.certifications
for each row execute function public.set_updated_at();

drop trigger if exists trg_exams_set_updated_at on public.exams;
create trigger trg_exams_set_updated_at
before update on public.exams
for each row execute function public.set_updated_at();

drop trigger if exists trg_exam_subjects_set_updated_at on public.exam_subjects;
create trigger trg_exam_subjects_set_updated_at
before update on public.exam_subjects
for each row execute function public.set_updated_at();

drop trigger if exists trg_questions_set_updated_at on public.questions;
create trigger trg_questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

drop trigger if exists trg_attempts_set_updated_at on public.attempts;
create trigger trg_attempts_set_updated_at
before update on public.attempts
for each row execute function public.set_updated_at();

drop trigger if exists trg_attempt_subjects_set_updated_at on public.attempt_subjects;
create trigger trg_attempt_subjects_set_updated_at
before update on public.attempt_subjects
for each row execute function public.set_updated_at();

-- =========================================================
-- validate attempt_subject belongs to same exam as attempt
-- =========================================================
create or replace function public.validate_attempt_subjects()
returns trigger
language plpgsql
as $$
declare
  v_attempt_exam_id uuid;
  v_subject_exam_id uuid;
  v_subject_name text;
begin
  select exam_id
    into v_attempt_exam_id
  from public.attempts
  where id = new.attempt_id;

  if v_attempt_exam_id is null then
    raise exception 'attempt_not_found: %', new.attempt_id;
  end if;

  select es.exam_id, es.name
    into v_subject_exam_id, v_subject_name
  from public.exam_subjects es
  where es.id = new.exam_subject_id;

  if v_subject_exam_id is null then
    raise exception 'exam_subject_not_found: %', new.exam_subject_id;
  end if;

  if v_attempt_exam_id <> v_subject_exam_id then
    raise exception 'attempt_subject_exam_mismatch';
  end if;

  if new.subject_name_snapshot is null or btrim(new.subject_name_snapshot) = '' then
    new.subject_name_snapshot := v_subject_name;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_attempt_subjects on public.attempt_subjects;
create trigger trg_validate_attempt_subjects
before insert or update of attempt_id, exam_subject_id, subject_name_snapshot
on public.attempt_subjects
for each row execute function public.validate_attempt_subjects();

-- =========================================================
-- auto-calculate attempt_answers.is_correct
-- =========================================================
create or replace function public.set_attempt_answer_correctness()
returns trigger
language plpgsql
as $$
begin
  if new.selected_answer is null then
    new.is_correct := false;
  else
    new.is_correct := (new.selected_answer = new.correct_answer_snapshot);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_attempt_answer_correctness on public.attempt_answers;
create trigger trg_set_attempt_answer_correctness
before insert or update of selected_answer, correct_answer_snapshot
on public.attempt_answers
for each row execute function public.set_attempt_answer_correctness();

-- =========================================================
-- finalize scoring for one attempt
-- rules:
-- - each selected subject must score >= 40
-- - average of selected subject scores >= 60
-- =========================================================
create or replace function public.finalize_attempt(p_attempt_id uuid)
returns void
language plpgsql
as $$
declare
  v_avg_score numeric(5,2);
  v_min_score numeric(5,2);
begin
  -- 과목별 점수 계산
  update public.attempt_subjects ats
  set
    score = coalesce(calc.score, 0),
    passed = (coalesce(calc.score, 0) >= 40),
    submitted_at = coalesce(ats.submitted_at, now()),
    updated_at = now()
  from (
    select
      aa.attempt_subject_id,
      round(
        100.0 * sum(case when aa.is_correct then 1 else 0 end)::numeric / nullif(count(*), 0),
        2
      ) as score
    from public.attempt_answers aa
    where aa.attempt_subject_id in (
      select id from public.attempt_subjects where attempt_id = p_attempt_id
    )
    group by aa.attempt_subject_id
  ) calc
  where ats.id = calc.attempt_subject_id;

  select
    round(avg(score), 2),
    min(score)
  into v_avg_score, v_min_score
  from public.attempt_subjects
  where attempt_id = p_attempt_id;

  update public.attempts
  set
    total_score = coalesce(v_avg_score, 0),
    passed = (coalesce(v_avg_score, 0) >= 60 and coalesce(v_min_score, 0) >= 40),
    submitted_at = coalesce(submitted_at, now()),
    status = 'submitted',
    updated_at = now()
  where id = p_attempt_id;
end;
$$;

-- =========================================================
-- optional helper: clone exam
-- =========================================================
create or replace function public.clone_exam(p_exam_id uuid, p_new_year integer, p_new_round smallint)
returns uuid
language plpgsql
as $$
declare
  v_old_exam public.exams%rowtype;
  v_new_exam_id uuid;
  v_old_subject record;
  v_new_subject_id uuid;
begin
  select *
    into v_old_exam
  from public.exams
  where id = p_exam_id;

  if v_old_exam.id is null then
    raise exception 'exam_not_found: %', p_exam_id;
  end if;

  insert into public.exams (
    certification_id,
    exam_year,
    exam_round,
    status,
    is_public
  )
  values (
    v_old_exam.certification_id,
    p_new_year,
    p_new_round,
    'draft',
    false
  )
  returning id into v_new_exam_id;

  for v_old_subject in
    select *
    from public.exam_subjects
    where exam_id = p_exam_id
    order by subject_order
  loop
    insert into public.exam_subjects (
      exam_id,
      subject_order,
      name,
      time_limit_minutes
    )
    values (
      v_new_exam_id,
      v_old_subject.subject_order,
      v_old_subject.name,
      v_old_subject.time_limit_minutes
    )
    returning id into v_new_subject_id;

    insert into public.questions (
      exam_subject_id,
      question_no,
      stem,
      choice_1,
      choice_2,
      choice_3,
      choice_4,
      correct_answer,
      explanation
    )
    select
      v_new_subject_id,
      q.question_no,
      q.stem,
      q.choice_1,
      q.choice_2,
      q.choice_3,
      q.choice_4,
      q.correct_answer,
      q.explanation
    from public.questions q
    where q.exam_subject_id = v_old_subject.id
    order by q.question_no;
  end loop;

  return v_new_exam_id;
end;
$$;