// Système scolaire congolais (RDC) — classes et options/filières.

export const CLASS_GROUPS: { group: string; items: string[] }[] = [
  {
    group: "Maternelle",
    items: [
      "1re maternelle",
      "2e maternelle",
      "3e maternelle",
    ],
  },
  {
    group: "Primaire",
    items: [
      "1re année primaire",
      "2e année primaire",
      "3e année primaire",
      "4e année primaire",
      "5e année primaire",
      "6e année primaire",
      "7e année du primaire",
      "8e année du primaire",
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

// Options / filières — uniquement aux humanités (le primaire n'a pas d'option).
export const OPTIONS: string[] = [
  "Sciences",
  "Technique",
  "Commercial et gestion",
  "Pédagogie",
  "Littéraire",
  "Nutrition",
  "Arts et métiers",
];

// Classes nécessitant une option : uniquement les humanités. Le primaire (y
// compris 7e et 8e année du primaire) est « libre », sans option.
const OPTION_CLASSES = new Set<string>([
  "1re année des humanités",
  "2e année des humanités",
  "3e année des humanités",
  "4e année des humanités",
]);

export function classRequiresOption(className: string): boolean {
  return OPTION_CLASSES.has(className);
}
