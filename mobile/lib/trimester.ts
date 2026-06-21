// Découpage de l'année scolaire en trimestres (périodes de 3 mois).
// L'année commence en septembre : 4 trimestres au total.
//   T1 : septembre · octobre · novembre
//   T2 : décembre · janvier · février
//   T3 : mars · avril · mai
//   T4 : juin · juillet · août

export type TrimesterMeta = {
  index: 1 | 2 | 3 | 4;
  short: string; // "T1"
  fr: string; // "1er trimestre"
  en: string; // "1st term"
  months: number[]; // mois 1-12 couverts
};

export const TRIMESTERS: TrimesterMeta[] = [
  { index: 1, short: "T1", fr: "1er trimestre", en: "1st term", months: [9, 10, 11] },
  { index: 2, short: "T2", fr: "2e trimestre", en: "2nd term", months: [12, 1, 2] },
  { index: 3, short: "T3", fr: "3e trimestre", en: "3rd term", months: [3, 4, 5] },
  { index: 4, short: "T4", fr: "4e trimestre", en: "4th term", months: [6, 7, 8] },
];

// Trimestre (1-4) auquel appartient une date.
export function trimesterOf(date: Date | string): 1 | 2 | 3 | 4 {
  const d = typeof date === "string" ? new Date(date) : date;
  const m = d.getMonth() + 1; // 1-12
  if (m >= 9 && m <= 11) return 1;
  if (m === 12 || m <= 2) return 2;
  if (m >= 3 && m <= 5) return 3;
  return 4;
}

// Trimestre courant (selon la date du jour).
export function currentTrimester(): 1 | 2 | 3 | 4 {
  return trimesterOf(new Date());
}

export function trimesterMeta(index: number): TrimesterMeta {
  return TRIMESTERS.find((t) => t.index === index) ?? TRIMESTERS[0];
}
