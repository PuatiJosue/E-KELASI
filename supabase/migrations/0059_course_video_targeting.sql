-- Vidéos des cours : ciblage de parents précis + upload de fichier vidéo.

-- Destinataires précis d'une vidéo (si vide → visible selon classe/école).
create table if not exists course_video_recipients (
  video_id  uuid not null references course_videos(id) on delete cascade,
  parent_id uuid not null references profiles(id) on delete cascade,
  primary key (video_id, parent_id)
);
alter table course_video_recipients enable row level security;

drop policy if exists cvr_parent_read on course_video_recipients;
create policy cvr_parent_read on course_video_recipients for select
  using (parent_id = auth.uid() or is_super_admin());

-- Une vidéo ciblée n'est visible que par ses destinataires ; une vidéo non
-- ciblée reste visible par tous les parents de l'école (comportement actuel).
drop policy if exists course_videos_parent_read on course_videos;
create policy course_videos_parent_read on course_videos for select using (
  (
    school_id in (select my_student_school_ids())
    and not exists (select 1 from course_video_recipients r where r.video_id = course_videos.id)
  )
  or exists (select 1 from course_video_recipients r where r.video_id = course_videos.id and r.parent_id = auth.uid())
  or is_super_admin()
);

-- Bucket de stockage des vidéos uploadées depuis l'appareil (≤ 50 Mo).
do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    raise notice 'storage.buckets not present, skipping';
    return;
  end if;

  execute $sql$
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('course-videos', 'course-videos', true, 52428800,
      array['video/mp4','video/quicktime','video/webm','video/x-matroska','video/3gpp','video/x-msvideo'])
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types
  $sql$;

  execute 'drop policy if exists "course_videos_read" on storage.objects';
  execute $sql$
    create policy "course_videos_read" on storage.objects for select
      using (bucket_id = 'course-videos')
  $sql$;

  execute 'drop policy if exists "course_videos_auth_write" on storage.objects';
  execute $sql$
    create policy "course_videos_auth_write" on storage.objects for all
      using (bucket_id = 'course-videos' and auth.uid() is not null)
      with check (bucket_id = 'course-videos' and auth.uid() is not null)
  $sql$;
end $$;
