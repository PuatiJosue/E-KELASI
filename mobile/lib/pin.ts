// PIN 4 chiffres pour les parents — transformation déterministe vers
// une chaîne ≥6 caractères acceptée par Supabase Auth.
//
// ⚠️ Pas de "sécurité" ajoutée par le suffixe (il est public dans le binaire
// client). La protection réelle vient :
//  - du rate limit serveur (5 tentatives / min / IP côté login, plus le
//    rate limit natif de Supabase Auth).
//  - du lockout après plusieurs échecs (configurable côté Supabase).
// L'entropie effective reste de 10 000 combinaisons — c'est un choix UX
// assumé pour les parents.

const SUFFIX = "x9k";

export function pinToPassword(pin: string): string {
  return `ekelasi-pin-${pin}-${SUFFIX}`;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
