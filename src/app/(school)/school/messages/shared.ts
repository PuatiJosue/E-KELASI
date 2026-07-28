// Helpers partagés par la messagerie école.

export function initials(name: string) {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export const money = (n: number, c = "CDF") => `${Math.round(n).toLocaleString("fr-FR")} ${c}`;

export const DEFAULT_REMINDER =
  "Bonjour, nous vous rappelons que des frais scolaires restent à régler pour votre enfant. " +
  "Merci de bien vouloir vous rapprocher de la direction pour régulariser la situation. Cordialement, la direction.";

