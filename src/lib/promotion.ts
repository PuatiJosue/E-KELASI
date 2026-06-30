// Logique pure du « passage de classe » (système congolais). Aucune dépendance
// serveur : utilisable côté client (écran de promotion) comme serveur (action).

// Séquence canonique des niveaux, de la 1re primaire à la 4e des humanités.
// `label` = class_name canonique écrit dans students.class_name / grade_level.
export const PROMOTION_LEVELS: { key: string; label: string; group: "primaire" | "secondaire" }[] = [
  { key: "p1", label: "1re année primaire", group: "primaire" },
  { key: "p2", label: "2e année primaire", group: "primaire" },
  { key: "p3", label: "3e année primaire", group: "primaire" },
  { key: "p4", label: "4e année primaire", group: "primaire" },
  { key: "p5", label: "5e année primaire", group: "primaire" },
  { key: "p6", label: "6e année primaire", group: "primaire" },
  { key: "b7", label: "7e année du primaire", group: "primaire" },
  { key: "b8", label: "8e année du primaire", group: "primaire" },
  { key: "h1", label: "1re année des humanités", group: "secondaire" },
  { key: "h2", label: "2e année des humanités", group: "secondaire" },
  { key: "h3", label: "3e année des humanités", group: "secondaire" },
  { key: "h4", label: "4e année des humanités", group: "secondaire" },
];

// Options/filières des humanités (à choisir lors de l'entrée en 1re humanités).
export const PROMOTION_OPTIONS = [
  "Sciences", "Technique", "Commercial et gestion", "Pédagogie",
  "Littéraire", "Nutrition", "Arts et métiers", "Professionnelle",
];

const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Détecte la clé de niveau (p1…p6, b7, b8, h1…h4) à partir d'un nom de classe libre. */
export function levelKeyOf(raw: string): string | null {
  const s = norm(raw);
  const digit = s.match(/(\d+)/)?.[1] ?? "";
  if (s.includes("primaire")) {
    if (digit && +digit >= 1 && +digit <= 6) return `p${digit}`;
    if (digit === "7") return "b7";
    if (digit === "8") return "b8";
    return null;
  }
  if (s.includes("humanit") || s.includes("secondaire")) {
    return digit && +digit >= 1 && +digit <= 4 ? `h${digit}` : null;
  }
  if (s.includes("base") || s.includes("annee")) {
    if (s.includes("7")) return "b7";
    if (s.includes("8")) return "b8";
  }
  return null;
}

export type Cycle = "maternelle" | "primaire" | "secondaire" | "autre";

/** Cycle d'enseignement déduit d'un nom de classe (pour grouper l'affichage). */
export function cycleOf(name: string): Cycle {
  const s = norm(name);
  if (s.includes("maternel")) return "maternelle";
  if (s.includes("humanit") || s.includes("secondaire")) return "secondaire";
  if (s.includes("primaire") || s.includes("base") || /\b[78]\s*(e|eme|ieme)/.test(s)) return "primaire";
  return "autre";
}

export type PromotionProposal =
  | { kind: "promote"; nextClass: string; enteringHumanities: boolean }
  | { kind: "graduate" } // fin de cycle (4e humanités) → diplômé / sortant
  | { kind: "unknown" }; // niveau non reconnu → à traiter manuellement

/** Proposition de classe supérieure pour un nom de classe donné. */
export function nextClassFor(className: string): PromotionProposal {
  const key = levelKeyOf(className);
  if (!key) return { kind: "unknown" };
  const idx = PROMOTION_LEVELS.findIndex((l) => l.key === key);
  if (idx < 0) return { kind: "unknown" };
  if (idx >= PROMOTION_LEVELS.length - 1) return { kind: "graduate" };
  const next = PROMOTION_LEVELS[idx + 1];
  return { kind: "promote", nextClass: next.label, enteringHumanities: key === "b8" };
}

export type PromotionActionKind = "promote" | "redouble" | "graduate" | "skip";
export type ProposedDecision = { action: PromotionActionKind; targetClass: string; needsOption: boolean };

/**
 * Décision par défaut proposée à l'écran pour un élève :
 *  - classe reconnue & non terminale → « Passe » vers la classe supérieure ;
 *  - 4e humanités → « Diplômé » ;
 *  - classe non reconnue → « Exclure » (à traiter à la main).
 * `needsOption` = entrée en humanités sans option encore définie.
 */
export function proposeDecision(className: string): ProposedDecision {
  const p = nextClassFor(className);
  if (p.kind === "promote") return { action: "promote", targetClass: p.nextClass, needsOption: p.enteringHumanities };
  if (p.kind === "graduate") return { action: "graduate", targetClass: "", needsOption: false };
  return { action: "skip", targetClass: "", needsOption: false };
}
