// Mode « live » : l'app bascule sur Supabase dès que les variables publiques
// sont présentes, sinon elle reste navigable sur des données de démonstration.

export function isLiveMode() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
