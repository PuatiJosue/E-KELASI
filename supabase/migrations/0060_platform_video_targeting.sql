-- Vidéos plateforme (E-KLASS) : ciblage de parents précis.

create table if not exists platform_video_recipients (
  video_id  uuid not null references platform_videos(id) on delete cascade,
  parent_id uuid not null references profiles(id) on delete cascade,
  primary key (video_id, parent_id)
);
alter table platform_video_recipients enable row level security;

drop policy if exists pvr_parent_read on platform_video_recipients;
create policy pvr_parent_read on platform_video_recipients for select
  using (parent_id = auth.uid() or is_super_admin());

-- Vidéo ciblée → visible uniquement par ses destinataires ; sinon visible par
-- tous les utilisateurs authentifiés (comportement actuel).
drop policy if exists platform_videos_read on platform_videos;
create policy platform_videos_read on platform_videos for select using (
  (
    auth.uid() is not null
    and not exists (select 1 from platform_video_recipients r where r.video_id = platform_videos.id)
  )
  or exists (select 1 from platform_video_recipients r where r.video_id = platform_videos.id and r.parent_id = auth.uid())
);
