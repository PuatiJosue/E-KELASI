# E-KELASI · App parents (mobile)

App React Native (Expo SDK 51) pour les parents — suivi scolaire de leurs enfants.

8 écrans : Welcome · Dashboard · Notes · Devoirs · Messagerie · Conversation · Profil & abonnement · Notifications.

---

## Lancement

### 1. Installer les dépendances

```sh
cd mobile
npm install
```

Première install ~3-5 min (Expo + RN sont gros).

### 2. (Optionnel) Configurer Supabase

```sh
cp .env.example .env.local
```

Édite `.env.local` avec les clés du Supabase local (voir [../SETUP_SUPABASE.md](../SETUP_SUPABASE.md)) :

```sh
EXPO_PUBLIC_SUPABASE_URL=http://<TON_IP_LAN>:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
```

> ⚠️ **IMPORTANT** : sur Expo Go, `127.0.0.1` ne fonctionne pas — c'est l'IP du téléphone, pas celle du PC. Remplace par ton IP locale (ex: `192.168.1.42`). Trouve-la avec `ipconfig` (Windows) → cherche "IPv4 Address" sous ton adapter Wi-Fi.

Sans `.env.local`, l'app tourne en **mode démo** (données mockées + bouton "Commencer" ouvre une fausse session).

### 3. Démarrer Expo

```sh
npm start
```

Un QR code apparaît dans le terminal. Sur ton iPhone :

1. Installe **Expo Go** depuis l'App Store (gratuit)
2. Ouvre l'app appareil photo iPhone → scan le QR
3. Tape sur la notification "Open in Expo Go"

L'app se charge en ~10 sec. Live-reload activé : sauve un fichier dans `mobile/`, l'app se rafraîchit instantanément.

> Sur Android : Expo Go → bouton "Scan QR code" dans l'app.

---

## Structure

```
mobile/
├── app/                       # Expo Router (file-based routing)
│   ├── _layout.tsx           # Root layout : auth gate + Stack + chargement polices
│   ├── index.tsx             # Welcome
│   ├── (tabs)/
│   │   ├── _layout.tsx       # TabBar (5 onglets)
│   │   ├── index.tsx         # Home (Dashboard) + composants partagés (GradeRow, etc.)
│   │   ├── grades.tsx        # Notes & moyennes
│   │   ├── homework.tsx      # Devoirs cette semaine
│   │   ├── messages.tsx      # Liste conversations
│   │   └── profile.tsx       # Profil & abonnement
│   ├── thread/[id].tsx       # Conversation (route dynamique)
│   └── notifications.tsx     # Modal notifications
├── components/               # Atomiques cross-screen
│   ├── Icon.tsx              # Wrapper @expo/vector-icons (Feather)
│   ├── Avatar.tsx
│   ├── Logo.tsx
│   ├── Card.tsx + Chip
│   ├── Button.tsx
│   └── Charts.tsx            # Sparkline + GradeRing (react-native-svg)
├── lib/
│   ├── theme.ts              # Couleurs + radii + fontes (miroir de tokens.css)
│   ├── i18n.tsx              # <T fr=... en=... /> + useT()
│   ├── mock.ts               # Données démo
│   ├── supabase.ts           # Client supabase-js + ExpoSecureStore
│   └── auth.tsx              # AuthProvider + useAuth() + mode démo
├── package.json
├── app.json                  # Expo config (bundle id, plugins…)
├── babel.config.js
└── tsconfig.json
```

---

## Scripts

| | |
|---|---|
| `npm start` | Démarrer Expo dev server (QR code) |
| `npm run ios` | Ouvrir sur iOS Simulator (Mac requis) |
| `npm run android` | Ouvrir sur Android emulator |
| `npm run web` | Aperçu dans le navigateur (UI limitée) |
| `npm run typecheck` | `tsc --noEmit` |

---

## Notes de portage du prototype

- **Layout** : `position: 'fixed'` (web) → `View` avec `SafeAreaView`. Les écrans modaux (Notifications, Thread) utilisent `Stack.Screen` au lieu de toggling `hideTabs`.
- **Routing** : `useState('home' | 'grades' …)` (proto) → Expo Router file-based avec groupe `(tabs)` pour la navigation par onglets.
- **CSS variables** (`var(--brand)`) → objet `useTheme()` qui retourne LIGHT ou DARK selon `useColorScheme()`.
- **Fonts** : `<link>` Google Fonts (proto) → `@expo-google-fonts/*` chargées avant `<Stack>`. ActivityIndicator pendant le chargement.
- **SVG** : `<svg>` (proto) → `react-native-svg`. API identique mais imports différents.
- **CSS classes** (`.ek-card`, `.ek-chip`) → composants `<Card>`, `<Chip>`.

---

## TODO Phase 2 (V2 mobile)

- [ ] Remplacer les mocks par des queries Supabase (`useEffect + supabase.from(...).select`)
- [ ] Vraie auth : page Login/Signup au lieu du bouton démo unique
- [ ] Stripe in-app subscription (`@stripe/stripe-react-native`)
- [ ] Push notifications (`expo-notifications` + token → Supabase)
- [ ] Build dev avec EAS Build pour iPhone (sans Mac, via Expo cloud)
- [ ] Publication App Store + Google Play
