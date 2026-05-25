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

```
src/
├── app/
│   ├── (admin)/             # routes auth-protégées (sidebar + topbar)
│   │   ├── layout.tsx       # shell admin
│   │   ├── overview/        # KPIs, MRR, top écoles
│   │   ├── schools/         # table partenaires
│   │   ├── billing/         # paiements Stripe
│   │   ├── support/         # kanban tickets
│   │   └── security/        # KPIs + audit log
│   ├── login/               # connexion Supabase (action server)
│   ├── api/stripe/webhook/  # webhook Stripe (stub)
│   ├── globals.css          # design tokens E-KELASI
│   └── layout.tsx           # root
├── components/
│   ├── admin/               # Sidebar, Topbar
│   ├── Avatar.tsx · Logo.tsx · Icon.tsx
│   ├── Charts.tsx           # Sparkline · MRRChart · Donut
│   └── KPI.tsx · PageHeader
└── lib/
    ├── i18n.tsx             # <T fr="..." en="..." />
    ├── mock.ts              # données démo
    ├── stripe.ts            # client Stripe
    └── supabase/            # client browser + server + types
```

---

## Design

Le design original est dans [`e-kelasi/`](e-kelasi/) — bundle Claude Design (prototype HTML/React+Babel).

Tokens et palette repris de [`e-kelasi/project/tokens.css`](e-kelasi/project/tokens.css) (ambre éducatif chaleureux, Bricolage Grotesque + Plus Jakarta Sans, mode clair/sombre).

---

## Prochaines étapes

- [ ] Générer les types Supabase : `supabase gen types typescript --linked > src/lib/supabase/types.ts`
- [ ] Middleware Next.js pour rafraîchir la session Supabase (`src/middleware.ts`)
- [ ] Remplacer les mocks par des fetch Supabase dans chaque écran
- [ ] App parent React Native (Expo) — Phase 2
- [ ] Console professeur (saisie de notes) — Phase 3
- [ ] Dashboard école/direction (stats, bulletins PDF, branding) — Phase 4

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Serveur de dev (port 3000) |
| `npm run build` | Build production |
| `npm run start` | Démarrer le build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
