// Système scolaire congolais (RDC) — classes et options/filières.

export const CLASS_GROUPS: { group: string; items: string[] }[] = [
  {
    group: "Éducation de base",
    items: [
      "1re année primaire",
      "2e année primaire",
      "3e année primaire",
      "4e année primaire",
      "5e année primaire",
      "6e année primaire",
      "7e année (éducation de base)",
      "8e année (éducation de base)",
    ],
  },
  {
    group: "Enseignement secondaire (humanités)",
    items: [
      "1re année des humanités",
      "2e année des humanités",
      "3e année des humanités",
      "4e année des humanités",
    ],
  },
];

export const ALL_CLASSES: string[] = CLASS_GROUPS.flatMap((g) => g.items);

// Options / filières — à partir de la 8e année (éducation de base) et en humanités.
export const OPTIONS: string[] = [
  "Sciences",
  "Technique",
  "Commercial et gestion",
  "Pédagogie",
  "Littéraire",
  "Nutrition",
  "Arts et métiers",
];

// Classes nécessitant une option (8e année et tout le secondaire/humanités).
const OPTION_CLASSES = new Set<string>([
  "8e année (éducation de base)",
  "1re année des humanités",
  "2e année des humanités",
  "3e année des humanités",
  "4e année des humanités",
]);

export function classRequiresOption(className: string): boolean {
  return OPTION_CLASSES.has(className);
}
