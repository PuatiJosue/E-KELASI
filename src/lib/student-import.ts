// Analyse pure d'un collage Excel / CSV d'élèves. Aucune dépendance :
// utilisable côté client (aperçu d'import) comme dans les tests.

export type ParsedStudent = { fullName: string; className: string; gradeLevel: string; option: string };

/** Colonnes attendues, dans l'ordre : Nom · Classe · Option · Niveau. */
export function parseStudentRows(text: string): ParsedStudent[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: ParsedStudent[] = [];
  lines.forEach((line, i) => {
    const delim = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
    const cells = line.split(delim).map((c) => c.trim());
    // Saute une éventuelle ligne d'en-tête (« Nom … Classe … »).
    if (i === 0 && /nom|name/i.test(cells[0] ?? "") && /class/i.test(cells[1] ?? "")) return;
    const [fullName = "", className = "", option = "", gradeLevel = ""] = cells;
    if (!fullName) return;
    out.push({ fullName, className, option, gradeLevel });
  });
  return out;
}

/** Lignes réellement importables (nom + classe renseignés). */
export function validStudentRows(rows: ParsedStudent[]): ParsedStudent[] {
  return rows.filter((r) => r.fullName.trim() && r.className.trim());
}

const norm = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

/** Clé d'identité d'un élève (nom + classe), insensible casse/accents/espaces. */
export function studentKey(fullName: string, className: string): string {
  return `${norm(fullName)}|${norm(className)}`;
}

/** Marque chaque ligne comme doublon si (nom+classe) est déjà apparu dans le lot. */
export function flagBatchDuplicates(rows: ParsedStudent[]): (ParsedStudent & { duplicate: boolean })[] {
  const seen = new Set<string>();
  return rows.map((r) => {
    const k = studentKey(r.fullName, r.className);
    const duplicate = seen.has(k);
    seen.add(k);
    return { ...r, duplicate };
  });
}

/** Modèle CSV à télécharger (en-tête + exemples). */
export const STUDENT_CSV_TEMPLATE =
  "Nom complet;Classe;Option;Niveau\n" +
  "Mamadou Ndoye;5e année primaire;;5e\n" +
  "Awa Sow;1re année des humanités;Sciences;1re\n";
