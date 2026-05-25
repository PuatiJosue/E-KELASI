# Setup Supabase Cloud — E-KELASI

Pas-à-pas pour créer la base de données et brancher l'app. **~10 minutes**.

---

## 1. Créer le projet (3 min)

1. Va sur [supabase.com](https://supabase.com) → **Start your project** → connecte-toi (GitHub recommandé)
2. **New project**
   - Name : `e-kelasi-dev`
   - Database password : génère-en un fort et **note-le** (tu peux le retrouver plus tard dans Settings → Database)
   - Region : `Europe (Paris)` ou `Europe (Frankfurt)` — au plus proche de tes utilisateurs (Afrique francophone + Europe)
   - Plan : **Free**
3. Attends ~2 min que le projet soit provisionné

## 2. Appliquer le schéma (3 min)

Dans le dashboard Supabase :

1. Sidebar gauche → **SQL Editor** → **New query**
2. Ouvre [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql) localement, copie tout, colle dans l'éditeur, clique **Run** (Ctrl+Enter)
   - Tu dois voir `Success. No rows returned.`
3. Nouvelle query → colle [`supabase/migrations/0002_rls_policies.sql`](supabase/migrations/0002_rls_policies.sql) → **Run**
4. Nouvelle query → colle [`supabase/seed.sql`](supabase/seed.sql) → **Run**
   - 8 écoles + 10 logs d'audit créés

Vérifie : sidebar → **Table Editor** → tu dois voir les tables `schools`, `profiles`, `audit_logs`, etc. La table `schools` contient 8 lignes.

## 3. Récupérer les clés (1 min)

1. Sidebar → **Settings** (icône engrenage en bas) → **API**
2. Copie ces 3 valeurs :
   - **Project URL** → `https://xxxxx.supabase.co`
   - **Project API keys → anon / public** → `eyJhbGc...` (long token)
   - **Project API keys → service_role / secret** → `eyJhbGc...` (autre long token — **secret, ne jamais commit**)

## 4. Configurer l'app (1 min)

Crée le fichier `.env.local` à la racine (à côté de `package.json`) :

```sh
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Stripe — à remplir plus tard, peut rester vide pour l'instant
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## 5. Créer un compte super admin (2 min)

1. Dashboard Supabase → sidebar → **Authentication** → **Users** → **Add user** → **Create new user**
   - Email : `yann@e-kelasi.com` (ou ton vrai email)
   - Password : choisis-en un
   - **Auto Confirm User** : ✅ coche-le (sinon il faut valider l'email)
2. SQL Editor → nouvelle query → colle :

```sql
-- Crée le profil correspondant avec le rôle super_admin
insert into profiles (id, email, full_name, role, locale)
select id, email, 'Yann Mbaye', 'super_admin', 'fr'
from auth.users
where email = 'yann@e-kelasi.com'
on conflict (id) do update set role = 'super_admin';
```

3. **Run**

## 6. Lancer l'app

```sh
npm install
npm run dev
```

→ [http://localhost:3000/login](http://localhost:3000/login) → connecte-toi avec les credentials du super admin → la console charge les **vraies données** depuis Supabase.

Vérifie : sur `/schools`, les écoles affichées viennent maintenant de la base (pas des mocks). Sur `/security`, les logs viennent de `audit_logs`.

---

## 7. Bonus — Générer les types TypeScript (optionnel)

Pour avoir l'autocomplete Supabase parfait dans tout le code :

```sh
npm install -g supabase
supabase login
supabase link --project-ref xxxxx   # le xxxxx de ton URL Supabase
supabase gen types typescript --linked > src/lib/supabase/types.ts
```

---

## Problèmes courants

- **"Failed to fetch" dans le navigateur** → vérifie que les 3 vars d'env sont bien dans `.env.local` et **redémarre** `npm run dev`
- **Redirigé en boucle vers /login** → le profil super_admin n'a pas été créé (étape 5) ou tu n'as pas confirmé l'email
- **Tables vides côté app mais OK dans Supabase** → les policies RLS bloquent : vérifie que ton user a bien `role = 'super_admin'` dans la table `profiles`

---

## Quand tu seras prêt pour la prod

1. Crée un 2e projet Supabase `e-kelasi-prod` (région idem)
2. Re-applique les 2 migrations (pas le seed)
3. Mets les clés prod dans Vercel (Settings → Environment Variables)
4. Déploie

Le code ne change pas.
