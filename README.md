# E-KELASI · Console super admin

Web admin pour la plateforme E-KELASI (suivi scolaire SaaS). Next.js 14 (App Router) · TypeScript · Tailwind · Supabase · Stripe.

> **Statut** — Phase 1 : console super admin web. App parents (React Native) et console prof à venir.

---

## Démarrage

```sh
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000) — redirige automatiquement vers `/overview`.

Sans variables d'environnement, l'app tourne en mode démo (données mockées de [`src/lib/mock.ts`](src/lib/mock.ts)). La page de login propose un lien « Continuer sans connexion (démo) ».

---

## Configuration

Copier `.env.example` vers `.env.local` et remplir :

```sh
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

### Base de données (Supabase)

Les migrations SQL sont dans [`supabase/migrations/`](supabase/migrations/) :

- [`0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql) — tables (schools, profiles, students, grades, homework, messages, subscriptions, payments, support_tickets, notifications, audit_logs)
- [`0002_rls_policies.sql`](supabase/migrations/0002_rls_policies.sql) — Row Level Security (super_admin, school_admin, teacher, parent)
- [`seed.sql`](supabase/seed.sql) — 8 écoles de démo + 10 événements audit log

Pour exécuter contre une instance Supabase :

```sh
# avec supabase CLI
supabase db push
psql $DATABASE_URL -f supabase/seed.sql
```

### Stripe

Webhook : `POST /api/stripe/webhook` ([code](src/app/api/stripe/webhook/route.ts)). En local :

```sh
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Structure

Chaque espace applicatif est un *route group* Next.js avec son propre shell, et
chaque espace a sa couche données dédiée dans `src/lib/`.

```
src/
├── app/
│   ├── (admin)/             # console super admin (écoles, facturation, support, sécurité)
│   ├── (school)/            # console direction d'école (élèves, finances, bulletins…)
│   ├── (teacher)/           # console professeur (notes, devoirs, présences)
│   ├── (surveillant)/       # espace surveillant (pointage des présences)
│   ├── api/                 # routes REST : Stripe, inscriptions parents, bibliothèque
│   └── login/ · inscription/ · reenroll/ · verify/   # parcours publics
├── components/
│   ├── admin/ · school/ · teacher/ · surveillant/    # composants par espace
│   ├── settings/ · auth/
│   └── Avatar · Charts · Icon · KPI · Shell…         # primitives transverses
└── lib/
    ├── env.ts               # isLiveMode() — bascule démo ↔ Supabase
    ├── result.ts            # type Result des server actions
    ├── auth/guards.ts       # gardes d'autorisation (requireSchoolAdmin…)
    ├── supabase/
    │   ├── client.ts        # client navigateur
    │   ├── server.ts        # client serveur (session, RLS active)
    │   ├── service.ts       # client service_role — contourne la RLS
    │   └── types.ts         # types générés par Supabase
    ├── admin/               # données console admin (schools, overview, billing…)
    ├── school/              # données console école (profile, kpis, people, classes, dossier)
    ├── teacher/             # données console prof (profile, classes, grades, bulletins…)
    └── finance/             # module Finance v2 (fees, treasury, reports, alerts…)
```

### Conventions

- **Séparation données / UI** — les `page.tsx` (Server Components) chargent via
  `src/lib/**`, puis passent des props à des composants clients ; aucun appel
  Supabase dans un composant client.
- **Mutations** — toujours des server actions (`actions.ts` à côté de la route),
  renvoyant le type `Result` de [`src/lib/result.ts`](src/lib/result.ts).
- **Accès service_role** — passer par [`serviceClient()`](src/lib/supabase/service.ts),
  et **uniquement** après un garde de [`src/lib/auth/guards.ts`](src/lib/auth/guards.ts),
  puisque ce client contourne la Row Level Security.
- **Mode démo** — `isLiveMode()` garde chaque accès base : sans variables
  d'environnement, l'app reste navigable sur les données de `src/lib/mock.ts`.

---

## Design

Le design original est dans [`e-kelasi/`](e-kelasi/) — bundle Claude Design (prototype HTML/React+Babel).

Tokens et palette repris de [`e-kelasi/project/tokens.css`](e-kelasi/project/tokens.css) (ambre éducatif chaleureux, Bricolage Grotesque + Plus Jakarta Sans, mode clair/sombre).

---

## Prochaines étapes

- [ ] Découper les derniers gros composants clients (`FraisScolairesTab`,
      `TimetableManager`, `StudentFormModal`, `StaffManager`)
- [ ] Typer le client `service_role` avec `Database` (aujourd'hui volontairement non typé)
- [ ] Étendre la couverture de tests au-delà des utilitaires purs

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Serveur de dev (port 3000) |
| `npm run build` | Build production |
| `npm run start` | Démarrer le build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
