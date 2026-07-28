// Formatage de la fiche élève : âge, date de naissance, sexe.

export function ageFrom(birth: string | null): string {
  if (!birth) return "—";
  const d = new Date(birth);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 100 ? `${age} ans` : "—";
}

export function fmtDate(birth: string | null): string {
  if (!birth) return "—";
  const d = new Date(birth);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export const sexLabel = (s: string | null) => (s === "M" ? "Masculin" : s === "F" ? "Féminin" : "—");
