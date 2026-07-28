// Résolution / création des matières à partir d'un nom saisi librement.
// Les profs ne peuvent que LIRE la table subjects (RLS) : la création passe
// donc par le service-role, après vérification de l'appartenance à l'école.

import { serviceClient } from "@/lib/supabase/service";

// Abréviation lisible : initiales des deux premiers mots, sinon 4 lettres.
function shortFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.trim().slice(0, 4);
}

// Couleur stable dérivée du nom (même matière → même couleur).
const PALETTE = ["#3A6DBC", "#9747BB", "#1F9D6B", "#C0843A", "#C0433A", "#3AAFB0", "#7A57D1"];
function colorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// Échappe les jokers ILIKE pour comparer le nom littéralement (insensible à la casse).
function escapeIlike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => "\\" + c);
}

// Renvoie l'id d'une matière de l'école, en la créant si elle n'existe pas.
export async function resolveOrCreateSubjectId(schoolId: string, rawName: string): Promise<string | null> {
  const name = rawName.trim();
  if (!name) return null;
  const svc = serviceClient();

  const { data: rows } = await svc
    .from("subjects")
    .select("id")
    .eq("school_id", schoolId)
    .ilike("name", escapeIlike(name))
    .limit(1);
  if (rows && rows.length > 0) return rows[0].id;

  const { data: created, error } = await svc
    .from("subjects")
    .insert({ school_id: schoolId, name, short_name: shortFromName(name), color: colorFromName(name) })
    .select("id")
    .single();
  if (error) {
    console.warn("[resolveOrCreateSubject]", error.message);
    return null;
  }
  return created.id;
}
