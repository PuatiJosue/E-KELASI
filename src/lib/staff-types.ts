// Types et constantes du personnel — sans import serveur (utilisable côté client).

export type StaffMember = {
  id: string;
  fullName: string;
  lastName: string | null;    // Nom
  middleName: string | null;  // Post-nom
  firstName: string | null;   // Prénom
  category: string;
  phone: string | null;
  email: string | null;
  qualifications: string | null;
  hireDate: string | null;
  status: string;
  photoUrl: string | null;
  address: string | null;
  notes: string | null;
  linkedUserId: string | null; // compte app rattaché (code consommé)
};

// Nom complet dérivé : « Nom Post-nom Prénom » (parties vides ignorées).
export function composeFullName(last?: string | null, middle?: string | null, first?: string | null): string {
  return [last, middle, first].map((s) => (s ?? "").trim()).filter(Boolean).join(" ");
}

// Découpe heuristique d'un full_name existant (fiches créées avant la décomposition).
export function splitFullName(full?: string | null): { lastName: string; middleName: string; firstName: string } {
  const t = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (t.length === 0) return { lastName: "", middleName: "", firstName: "" };
  if (t.length === 1) return { lastName: t[0], middleName: "", firstName: "" };
  if (t.length === 2) return { lastName: t[0], middleName: "", firstName: t[1] };
  return { lastName: t[0], middleName: t[1], firstName: t.slice(2).join(" ") };
}

export const STAFF_CATEGORIES = ["enseignant", "surveillant", "direction", "ouvrier", "autre"] as const;

export const CATEGORY_LABEL: Record<string, string> = {
  enseignant: "Enseignant",
  surveillant: "Surveillant",
  direction: "Direction",
  ouvrier: "Ouvrier",
  autre: "Autre",
};
