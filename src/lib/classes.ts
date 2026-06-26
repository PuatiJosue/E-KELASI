// Identité d'une classe = couple (class_name, option).
// Dans le système congolais, un même niveau scindé par option/filière
// (Sciences, Commercial et gestion, Littéraire…) constitue des classes
// distinctes. Ces helpers centralisent le libellé et la clé partout où
// l'app liste, regroupe ou filtre les classes.

// Option normalisée : "" / espaces → null (niveau sans option = primaire, 7e/8e).
export const normOption = (option?: string | null): string | null =>
  (option ?? "").trim() || null;

// Libellé d'affichage « Niveau — Option » (tiret cadratin). Sans option → niveau seul.
export function classLabel(className?: string | null, option?: string | null): string {
  const c = (className ?? "").trim() || "—";
  const o = normOption(option);
  return o ? `${c} — ${o}` : c;
}

// Clé stable (value de <select>, clés React, identifiants internes) — pas pour l'affichage.
// Sépare niveau et option par un unit-separator (U+001F), absent des noms saisis.
export function classKey(className?: string | null, option?: string | null): string {
  const c = (className ?? "").trim();
  const o = normOption(option);
  return o ? `${c}${o}` : c;
}
