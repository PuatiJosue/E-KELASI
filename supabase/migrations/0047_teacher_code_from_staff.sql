-- Le code d'accès prof est désormais généré DEPUIS la fiche du personnel
-- (la direction remplit l'identité complète, puis génère le code). On relie
-- donc le code à la fiche staff_members ; à la consommation, on rattache le
-- compte créé à la fiche (staff_members.linked_user_id).

alter table teacher_access_codes
  add column if not exists staff_id uuid references staff_members(id) on delete cascade;

create index if not exists idx_tac_staff on teacher_access_codes(staff_id);
