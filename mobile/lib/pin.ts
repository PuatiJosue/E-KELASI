// Codes d'accès parent.
//
// 1) Code de CONNEXION : 8 caractères minimum, lettres et chiffres uniquement
//    (pas de caractères spéciaux). Il sert directement de mot de passe Supabase.
//    Entropie réelle bien supérieure aux anciens 4 chiffres.
//
// 2) Code de DOSSIER (verrou local) : 4 chiffres, stocké sur l'appareil
//    (expo-secure-store, voir lib/lock.tsx). Demandé à l'ouverture de l'app
//    avant d'accéder aux dossiers des enfants. `isValidPin` valide ce code-là.

// ── Code de connexion (8+ caractères alphanumériques) ────────────────
export function isValidAccessCode(code: string): boolean {
  return /^[A-Za-z0-9]{8,}$/.test(code);
}

// Le code de connexion EST le mot de passe Supabase (≥8 alphanum, accepté tel quel).
export function codeToPassword(code: string): string {
  return code;
}

// ── Code du dossier (verrou local, 4 chiffres) ───────────────────────
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
