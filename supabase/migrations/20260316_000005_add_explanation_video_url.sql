alter table public.questions
  add column if not exists explanation_video_url text;

alter table public.attempt_answers
  add column if not exists explanation_video_url_snapshot text;

update public.questions
set explanation_video_url = null
where explanation_video_url is distinct from null;

update public.attempt_answers
set explanation_video_url_snapshot = null
where explanation_video_url_snapshot is distinct from null;
