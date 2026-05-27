# Supabase Storage — notes E-KELASI

## Statut actuel

**Storage désactivé en local** (`supabase/config.toml` → `[storage] enabled = false`)
car WSL2 limité à 2 GB ne peut pas faire tourner tous les containers + le
container Storage (~300 MB) sans OOM.

→ La fonctionnalité **upload de couverture** dans `/teacher/library` retombe
proprement sur l'input URL (le `CoverPicker` détecte l'absence de bucket
et bascule en mode "URL").

## Pour activer sur Supabase Cloud (à venir)

1. Sur Supabase Cloud, Storage est **toujours activé** — rien à faire côté config.

2. Re-appliquer la migration `0013_book_covers_storage.sql` (déjà dans le repo,
   sera dans la liste des migrations à pusher via `supabase db push`).
   La migration est idempotente et **no-op si Storage n'est pas disponible** —
   donc déjà appliquée en local sans danger.

3. Vérifier le bucket dans Studio Cloud → Storage :
   - Bucket `book-covers` public, 5 MB limite, MIME jpeg/png/webp
   - Policies : read public, insert pour teacher/school_admin, update/delete pour owner

4. **C'est tout.** L'upload depuis `/teacher/library` (modale "Ajouter un livre")
   marchera automatiquement — chemin : `<school_id>/<uuid>.<ext>`.

## Pour ré-activer Storage en local (si tu as plus de RAM)

1. Bump WSL2 à 3 GB :
   ```
   # %USERPROFILE%\.wslconfig
   [wsl2]
   memory=3GB
   processors=4
   swap=4GB
   ```
2. `wsl --shutdown` + relance Docker Desktop
3. Édite `supabase/config.toml` → `[storage] enabled = true`
4. `supabase stop --no-backup && supabase start`
5. `docker exec -i supabase_db_E-KELASI psql -U postgres -d postgres < supabase/migrations/0013_book_covers_storage.sql`
