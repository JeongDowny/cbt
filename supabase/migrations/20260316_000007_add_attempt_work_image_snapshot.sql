alter table public.attempt_answers
  add column if not exists work_image_path_snapshot text;

update public.attempt_answers
set work_image_path_snapshot = null
where work_image_path_snapshot is distinct from null;
