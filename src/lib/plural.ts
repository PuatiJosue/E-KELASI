// Accord du pluriel pour les libellés comptés.
//
// Français : 0 et 1 restent au singulier (« 0 élève », « 1 élève »).
// Anglais  : seul 1 est au singulier (« 0 students », « 1 student »).

export function pluralFr(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n > 1 ? plural : singular}`;
}

export function pluralEn(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
