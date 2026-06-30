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

// Convertit l'entrée en Date locale. Une chaîne « YYYY-MM-DD » est interprétée
// dans le fuseau local (et non en UTC), pour éviter un décalage d'un jour aux
// frontières de mois selon le fuseau du serveur.
function asDate(date: Date | string): Date {
  if (typeof date !== "string") return date;
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return new Date(date);
}

// Trimestre (1-4) auquel appartient une date.
export function trimesterOf(date: Date | string): 1 | 2 | 3 | 4 {
  const d = asDate(date);
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

// Date représentative (ISO yyyy-mm-dd) d'un trimestre dans l'année scolaire
// en cours — utilisée pour caler une cote dans le bon trimestre lors de la saisie.
export function representativeDateForTrimester(index: number, now = new Date()): string {
  const m = now.getMonth() + 1;
  const startYear = m >= 9 ? now.getFullYear() : now.getFullYear() - 1; // année de septembre
  // mois/jour représentatifs par trimestre
  const map: Record<number, { year: number; month: number }> = {
    1: { year: startYear, month: 10 },     // octobre
    2: { year: startYear + 1, month: 1 },  // janvier
    3: { year: startYear + 1, month: 4 },  // avril
    4: { year: startYear + 1, month: 7 },  // juillet
  };
  const { year, month } = map[index] ?? map[1];
  // Si le trimestre choisi est le trimestre courant, on garde la date du jour.
  if (trimesterOf(now) === index) return now.toISOString().slice(0, 10);
  return `${year}-${String(month).padStart(2, "0")}-15`;
}

// Libellé de l'année scolaire d'une date, ex. "2025–2026".
export function schoolYearLabel(date: Date | string = new Date()): string {
  const d = asDate(date);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return m >= 9 ? `${y}–${y + 1}` : `${y - 1}–${y}`;
}
