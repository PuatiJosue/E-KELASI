# Setup Stripe — E-KELASI

Activer le paiement in-app dans l'app mobile (abonnement parent) + webhook qui écrit en DB. **~15-20 min**.

---

## 1. Créer un compte Stripe test (3 min)

1. [dashboard.stripe.com/register](https://dashboard.stripe.com/register) → crée un compte (email + mot de passe)
2. Vérifie l'email
3. En haut à droite, tu dois voir un toggle **"Mode test"** activé (orange). Reste en test pour le dev.

## 2. Créer les Products + Prices (5 min)

Dans le dashboard Stripe (mode test) :

1. Sidebar → **Produits** → **+ Ajouter un produit**
2. Crée 3 produits :

| Nom | Prix | Récurrence |
|---|---|---|
| **E-KELASI Essentiel** | 9,00 € | Mensuel |
| **E-KELASI Famille** | 19,00 € | Mensuel |
| **E-KELASI Premium** | 29,00 € | Mensuel |

Pour chacun :
- Type : **Récurrent**
- Devise : **EUR**
- Période : **Mensuel**

3. Après création, **clique sur chaque produit** → copie le **Price ID** (`price_xxxxxxxxxxxxx`)

## 3. Récupérer les clés API (1 min)

1. Sidebar → **Développeurs** → **Clés API**
2. Copie :
   - **Clé publiable** : `pk_test_xxxxxxxxxxxx`
   - **Clé secrète** : `sk_test_xxxxxxxxxxxx` (clic sur "Révéler")

## 4. Configurer le webhook Stripe → Supabase (5 min)

Le webhook reçoit les events Stripe (subscription created/updated, payment succeeded/failed) et écrit en DB.

### En local (via Stripe CLI)

```sh
# Installer Stripe CLI (Windows via scoop ou télécharger l'exe)
scoop install stripe
# Ou : https://github.com/stripe/stripe-cli/releases

# Login (ouvre le browser)
stripe login

# Forward les events vers ton Next.js local
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Le CLI affiche : `Ready! Your webhook signing secret is whsec_xxxxxxx` → **copie ce secret**.

### En production (vers Vercel)

Plus tard, configure dans le dashboard Stripe :
- **Développeurs** → **Webhooks** → **+ Ajouter un endpoint**
- URL : `https://<ton-domaine>/api/stripe/webhook`
- Events : `customer.subscription.*`, `invoice.payment_*`
- Copie le **Signing secret** dans l'env Vercel.

## 5. Mettre à jour les `.env` (2 min)

### `.env.local` (racine, pour Next.js)

```sh
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx   # depuis stripe listen
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxx
```

### `mobile/.env.local`

```sh
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxx
EXPO_PUBLIC_STRIPE_PRICE_ESSENTIEL=price_xxxxxxxxxxxxxx
EXPO_PUBLIC_STRIPE_PRICE_FAMILLE=price_xxxxxxxxxxxxxx
EXPO_PUBLIC_STRIPE_PRICE_PREMIUM=price_xxxxxxxxxxxxxx

# IP du PC où tourne Next.js, depuis ton Android
EXPO_PUBLIC_WEB_API_URL=http://192.168.1.77:3000
```

## 6. Tester

1. **Terminal 1** : `cd C:\Projects\E-KELASI && supabase start`
2. **Terminal 2** : `cd C:\Projects\E-KELASI && npm run dev` (Next.js)
3. **Terminal 3** : `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. **Terminal 4** : `cd C:\Projects\E-KELASI\mobile && npx expo start --port 8082 --lan`

Sur ton Android :
1. Crée un nouveau compte parent (page Signup)
2. Tu arrives sur la page **Subscribe** → choisis Famille → tape **"Démarrer l'essai gratuit"**
3. La **PaymentSheet Stripe** s'ouvre
4. Utilise une [carte de test](https://stripe.com/docs/testing) : `4242 4242 4242 4242` / date future quelconque / CVC 123
5. Confirme → tu vois "Bienvenue !" → retour sur Profil

Vérifie côté Stripe Dashboard → **Paiements** : tu dois voir la subscription créée en mode trial.
Vérifie côté DB :
```sh
docker exec supabase_db_E-KELASI psql -U postgres -d postgres -c "select plan, status, amount_cents from subscriptions order by created_at desc limit 3;"
```
