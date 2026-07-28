import type { StudentFormValues } from "@/app/(school)/school/students/actions";

// `avatarUrl` peut être null côté dossier : on l'exclut pour le retyper.
export type StudentFormInitial = Partial<Omit<StudentFormValues, "avatarUrl">> & {
  avatarUrl?: string | null;
};

