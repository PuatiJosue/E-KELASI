// Types et constantes du personnel — sans import serveur (utilisable côté client).

export type StaffMember = {
  id: string;
  fullName: string;
  category: string;
  phone: string | null;
  email: string | null;
  qualifications: string | null;
  hireDate: string | null;
  status: string;
  photoUrl: string | null;
  address: string | null;
  notes: string | null;
};

export const STAFF_CATEGORIES = ["enseignant", "surveillant", "direction", "ouvrier", "autre"] as const;

export const CATEGORY_LABEL: Record<string, string> = {
  enseignant: "Enseignant",
  surveillant: "Surveillant",
  direction: "Direction",
  ouvrier: "Ouvrier",
  autre: "Autre",
};
