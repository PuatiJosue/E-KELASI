# E-KELASI · Notes de sécurité pré-production

Ce qui ne peut pas être fait depuis le code et qu'il faut configurer
**à la main** dans les dashboards (Supabase, Stripe, Vercel) avant ouverture publique.

---

## 1. Supabase Cloud (dashboard)

### Authentification
- **Auth → Providers → Email** : activer **"Confirm email"** (sinon n'importe qui s'inscrit avec un email qu'il ne possède pas).
- **Auth → Email Templates → Reset password** : adapter le template français (le lien doit pointer vers `<APP_URL>/auth/confirm?next=/update-password` — déjà géré par le code).
- **Auth → URL Configuration** :
  - **Site URL** : `https://ton-domaine.com` (vrai domaine de prod)
  - **Redirect URLs** : ajouter `https://ton-domaine.com/auth/confirm`
- **Auth → Sessions** : ajuster la durée du refresh token selon ta tolérance (défaut : 60 jours).

### Storage
- Le bucket `book-covers` est créé par la migration 0013 quand Storage est actif.
  Vérifier dans **Storage** qu'il existe bien et que les policies sont là.
- Activer Storage sur le projet cloud (en local il est désactivé pour la RAM).

### Rate limiting auth
- **Auth → Rate Limits** : Supabase a son propre rate-limit sur signup/signin. Vérifier
  qu'il est bien activé (par défaut oui sur le plan gratuit, 30 req/h par IP).

---

## 2. Stripe (dashboard)

- Créer 3 **Prices** récurrents (essentiel, famille, premium) → noter les `price_xxx`.
- Mode **Live** : utiliser les clés `sk_live_...` / `pk_live_...` (jamais les `_test` en prod).
- **Webhooks → Endpoints** : ajouter `https://ton-domaine.com/api/stripe/webhook`
  avec les événements : `customer.subscription.*`, `invoice.payment_succeeded`,
  `invoice.payment_failed`. Récupérer le **secret** `whsec_...`.

---

## 3. Variables d'environnement (Vercel → Production)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...            # NEVER expose. Server-only.

STRIPE_SECRET_KEY=sk_live_...            # Server-only
STRIPE_WEBHOOK_SECRET=whsec_...          # Server-only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Allowlist des prix Stripe — empêche le client d'imposer un priceId arbitraire
STRIPE_PRICE_ESSENTIEL=price_xxx
STRIPE_PRICE_FAMILLE=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx

# Origine canonique de l'app (utilisée pour les emails de reset + invite)
NEXT_PUBLIC_APP_URL=https://ton-domaine.com
```

**Règle d'or** : tout ce qui commence par `NEXT_PUBLIC_` est visible dans le navigateur.
Ne JAMAIS y mettre une clé `service_role`, `sk_live_`, ou `whsec_`.

---

## 4. Vercel

- **HTTPS forcé** : actif par défaut. Vérifier dans Settings → Domains que le domaine
  custom est en HTTPS uniquement.
- **WAF / Firewall** : si plan Pro, activer le Vercel WAF sur les routes `/api/*`
  et `/login` (anti DDoS, anti scrapers).
- **Preview deployments** : penser à protéger les previews par mot de passe Vercel,
  sinon n'importe qui avec l'URL peut voir une version en cours.

---

## 5. Limites du rate-limiter actuel

`src/lib/rate-limit.ts` est un fallback **en mémoire** — il bloque le brute-force
opportuniste mais ne survit pas aux cold starts ni au multi-instance Vercel.

**Avant fort trafic**, remplacer par `@upstash/ratelimit` ou Vercel KV. La signature
`ratelimit(key, { limit, windowMs })` est volontairement identique pour faciliter
le swap.

---

## 6. Migrations à pousser sur Supabase Cloud

Après `supabase link` au projet cloud, lancer :
```sh
supabase db push
```
Vérifier en particulier que `0014_security_hardening.sql` est bien appliquée
(c'est elle qui empêche l'élévation de privilèges et la triche de montant).

---

## 7. Checklist finale (avant `vercel --prod`)

- [ ] Confirmation email activée (Supabase)
- [ ] Email reset template OK
- [ ] Site URL + Redirect URLs configurés
- [ ] Toutes les env vars en Production (clés **live** uniquement)
- [ ] Webhook Stripe enregistré + testé
- [ ] Storage bucket `book-covers` actif et bien provisionné
- [ ] Migration `0014_security_hardening` appliquée en cloud
- [ ] HTTPS forcé sur le domaine
- [ ] Compte super_admin réel créé (et le compte de démo `admin@ekelasi.demo` supprimé)
