// Traduit l'erreur brute de `admin.auth.admin.createUser` (Supabase, en anglais)
// en message clair pour l'utilisateur, sans exposer les détails techniques.
// Utilisé par les inscriptions école et prof pour donner la VRAIE raison d'un
// échec (email déjà pris vs format refusé) au lieu d'un message ambigu.
export function createUserErrorMessage(raw?: string | null): string {
  const msg = (raw ?? "").toLowerCase();
  if (msg.includes("already") || msg.includes("registered") || msg.includes("exist") || msg.includes("duplicate")) {
    return "Cet email est déjà utilisé par un autre compte.";
  }
  if (msg.includes("email") && (msg.includes("invalid") || msg.includes("validate"))) {
    return "Email refusé par le système : vérifie l'adresse (format non accepté).";
  }
  if (msg.includes("password")) {
    return "Mot de passe refusé : choisis-en un plus solide (8 caractères minimum).";
  }
  return "Impossible de créer le compte. Réessaie, ou utilise une autre adresse email.";
}
