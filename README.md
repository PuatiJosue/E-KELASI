# E-KLASS

Plateforme SaaS de suivi scolaire pour les établissements de RDC : elle relie la
direction, les professeurs, les surveillants et les parents autour du dossier de
l'élève — inscriptions, notes, bulletins, présences, finances et messagerie.

**Next.js 14** (App Router, Server Components & Server Actions) · **TypeScript**
strict · **Tailwind** · **Supabase** (Postgres + Auth + Storage, RLS) · **Stripe**

> Ce dépôt contient l'application web. L'application mobile parents (Expo /
> React Native) vit dans [`mobile/`](mobile/).

---

## Les quatre espaces

L'application n'est pas un seul back-office : chaque rôle a son espace, son shell
et sa couche données. `src/middleware.ts` route chaque utilisateur vers le sien et
empêche l'accès aux autres.

| Espace | Route | Rôle | Ce qu'on y fait |
|---|---|---|---|
| Super admin | `/overview` | `super_admin` | Écoles partenaires, facturation, support, journal d'audit |
| Direction | `/school/…` | `school_admin` | Élèves, classes, finances, bulletins, emploi du temps, messagerie |
| Professeur | `/teacher/…` | `teacher` | Saisie des notes, devoirs, présences, journal de bord |
| Surveillant | `/surveillant/…` | `surveillant` | Pointage des présences |

---

## Démarrage

```sh
npm install
npm run dev
```

Puis [http://localhost:3000](http://localhost:3000) — la racine redirige vers
l'espace correspondant au rôle du compte connecté.

Sans variables d'environnement Supabase, `isLiveMode()` renvoie `false` et
l'application se rabat sur les données de démonstration de
[`src/lib/mock.ts`](src/lib/mock.ts) : les écrans restent navigables sans base.

> **Attention** — `.env.local` peut pointer sur une instance Supabase **locale**
> (`http://127.0.0.1:54321`). Dans ce cas la connexion échoue tant que
> `supabase start` n'a pas été lancé, même avec des identifiants valides en
> production.

---

## Configuration

Copier [`.env.example`](.env.example) vers `.env.local` et remplir les clés
Supabase, Stripe, l'allowlist des prix et l'origine canonique de l'app.

### Base de données

77 migrations SQL versionnées dans [`supabase/migrations/`](supabase/migrations/),
de `0001_initial_schema.sql` au schéma courant. Les politiques **Row Level
Security** (`0002_rls_policies.sql`, puis affinées) isolent les données par école
et par rôle.

```sh
supabase db push
psql $DATABASE_URL -f supabase/seed.sql
```

### Stripe

Webhook : `POST /api/stripe/webhook`
([code](src/app/api/stripe/webhook/route.ts)). En local :

```sh
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Le tarif de l'abonnement école est piloté par le code
([`src/lib/school-price.ts`](src/lib/school-price.ts)), pas par un Price Stripe à
maintenir.

---

## Structure

Chaque espace applicatif est un *route group* Next.js avec son propre shell, et
chaque espace a sa couche données dédiée dans `src/lib/`.

```
src/
├── app/
│   ├── (admin)/             # console super admin
│   ├── (school)/            # console direction d'école
│   ├── (teacher)/           # console professeur
│   ├── (surveillant)/       # espace surveillant
│   ├── api/                 # Stripe, inscriptions parents, bibliothèque
│   └── login/ · inscription/ · reenroll/ · verify/   # parcours publics
├── middleware.ts            # session Supabase + routage par rôle
├── components/
│   ├── admin/ · school/ · teacher/ · surveillant/    # composants par espace
│   ├── form/ · settings/ · auth/                     # briques transverses
│   └── Avatar · Charts · Icon · KPI · Shell…
└── lib/
    ├── env.ts               # isLiveMode() — bascule démo ↔ Supabase
    ├── result.ts            # type Result des server actions
    ├── auth/guards.ts       # gardes d'autorisation (requireSchoolAdmin…)
    ├── supabase/
    │   ├── client.ts        # client navigateur
    │   ├── server.ts        # client serveur (session, RLS active)
    │   ├── service.ts       # client service_role — contourne la RLS
    │   └── types.ts         # types générés par Supabase
    ├── admin/               # données console admin
    ├── school/              # données console école
    ├── teacher/             # données console prof
    └── finance/             # module Finance (frais, trésorerie, caisse, rapports)
```

### Conventions

- **Séparation données / UI** — les `page.tsx` (Server Components) chargent via
  `src/lib/**`, puis passent des props à des composants clients ; aucun appel
  Supabase dans un composant client.
- **Mutations** — toujours des server actions (`actions.ts` à côté de la route),
  renvoyant le type `Result` de [`src/lib/result.ts`](src/lib/result.ts).
- **Accès `service_role`** — passer par
  [`serviceClient()`](src/lib/supabase/service.ts), et **uniquement** après un
  garde de [`src/lib/auth/guards.ts`](src/lib/auth/guards.ts) : ce client
  contourne la Row Level Security.
- **Mode démo** — `isLiveMode()` garde chaque accès base, pour que l'app reste
  navigable sans Supabase.
- **Taille des fichiers** — aucun fichier écrit à la main ne dépasse ~300 lignes ;
  au-delà, on découpe par responsabilité.

---

## Qualité

```sh
npm run typecheck   # tsc --noEmit, mode strict
npm run lint        # ESLint (config next)
npm test            # vitest
npm run build       # build de production
```

État actuel : **0 erreur** TypeScript, **0 erreur** ESLint, build vert.

Les tests couvrent aujourd'hui les utilitaires purs (classes, promotion, import
d'élèves, trimestres). **Les écrans ne sont pas encore testés** — c'est la
principale dette du projet, et la prochaine étape ci-dessous.

---

## Design

Le prototype d'origine est dans [`e-kelasi/`](e-kelasi/) (bundle HTML/React).
Les tokens et la palette viennent de
[`e-kelasi/project/tokens.css`](e-kelasi/project/tokens.css) : ambre éducatif
chaleureux, Bricolage Grotesque + Plus Jakarta Sans, mode clair/sombre.

---

## Prochaines étapes

- [ ] Tester les parcours critiques (encaissement, fiche élève, emploi du temps) —
      aujourd'hui seuls `tsc` et le build protègent des régressions d'interface
- [ ] Typer le client `service_role` avec `Database` (volontairement non typé
      aujourd'hui : certaines tables ne sont pas couvertes par les types générés)
- [ ] Mettre en place une CI (typecheck + lint + tests à chaque push)

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | Build de production |
| `npm run start` | Démarrer le build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Tests (vitest) |
| `npm run test:watch` | Tests en mode watch |
