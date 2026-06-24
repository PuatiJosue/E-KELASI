-- Annonces : pièce jointe optionnelle (document envoyé aux parents).
-- L'école peut joindre un fichier (PDF, image, doc) à une annonce ; l'URL
-- signée est stockée ici et relayée dans la notification du parent.

alter table announcements add column if not exists attachment_url  text;
alter table announcements add column if not exists attachment_name text;
