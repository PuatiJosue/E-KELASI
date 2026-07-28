"use client";

// Logique de la fiche élève : état des champs, rubriques libres, pièces
// jointes et soumission. Séparée de l'affichage pour que les sections du
// formulaire restent purement présentationnelles.

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  addStudentAction,
  updateStudentAction,
  type StudentDocument,
  type StudentExtraField,
  type StudentFormValues,
} from "@/app/(school)/school/students/actions";
import type { StudentFormInitial } from "./types";

// Les champs texte du formulaire, tous pilotés par le même setter.
export type StudentTextField =
  | "lastName" | "middleName" | "firstName" | "sex" | "birthPlace" | "birthDate"
  | "className" | "option" | "enrolledAt" | "address" | "provinceOrigin"
  | "fatherName" | "motherName" | "guardianName" | "guardianRelation" | "guardianPhone"
  | "bloodGroup" | "allergies" | "medicalNotes" | "emergencyContactName" | "emergencyContactPhone"
  | "previousSchool" | "previousClass" | "observation";

export type StudentFields = Record<StudentTextField, string>;

const TEXT_FIELDS: StudentTextField[] = [
  "lastName", "middleName", "firstName", "sex", "birthPlace", "birthDate",
  "className", "option", "enrolledAt", "address", "provinceOrigin",
  "fatherName", "motherName", "guardianName", "guardianRelation", "guardianPhone",
  "bloodGroup", "allergies", "medicalNotes", "emergencyContactName", "emergencyContactPhone",
  "previousSchool", "previousClass", "observation",
];

function initialFields(initial: StudentFormInitial | undefined, editing: boolean): StudentFields {
  const out = {} as StudentFields;
  for (const k of TEXT_FIELDS) out[k] = (initial?.[k] as string) ?? "";
  // La date d'inscription est pré-remplie à aujourd'hui, mais seulement en création.
  out.enrolledAt = initial?.enrolledAt ?? (editing ? "" : new Date().toISOString().slice(0, 10));
  return out;
}

export function useStudentForm({
  studentId,
  initial,
  onClose,
}: {
  studentId?: string;
  initial?: StudentFormInitial;
  onClose: () => void;
}) {
  const router = useRouter();
  const editing = Boolean(studentId);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const [fields, setFields] = useState<StudentFields>(() => initialFields(initial, editing));
  const set = (key: StudentTextField, value: string) => setFields((f) => ({ ...f, [key]: value }));

  const [extraFields, setExtraFields] = useState<StudentExtraField[]>(initial?.extraFields ?? []);
  // Documents déjà joints (modification) : conservés sauf suppression explicite.
  const [existingDocs, setExistingDocs] = useState<StudentDocument[]>(initial?.documents ?? []);

  const photoRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.avatarUrl ?? null);

  const [error, setError] = useState<string | null>(null);

  // Upload d'un fichier vers le bucket privé student-files → URL signée 1 an.
  const uploadFile = async (file: File, prefix: string): Promise<string | null> => {
    const supabase = createClient();
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("student-files").upload(path, file, { upsert: false });
    if (upErr) return null;
    const { data: signed } = await supabase.storage.from("student-files").createSignedUrl(path, 60 * 60 * 24 * 365);
    return signed?.signedUrl ?? null;
  };

  const addExtra = () => setExtraFields((prev) => [...prev, { label: "", value: "" }]);
  const setExtra = (i: number, patch: Partial<StudentExtraField>) =>
    setExtraFields((prev) => prev.map((f, k) => (k === i ? { ...f, ...patch } : f)));
  const removeExtra = (i: number) => setExtraFields((prev) => prev.filter((_, k) => k !== i));
  const removeDoc = (i: number) => setExistingDocs((prev) => prev.filter((_, k) => k !== i));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fields.lastName.trim() || !fields.firstName.trim() || !fields.className.trim()) {
      setError("Nom, prénom et classe sont requis.");
      return;
    }

    const folder = `students/${studentId ?? crypto.randomUUID()}`;
    // Non défini = photo inchangée (en modification) / pas de photo (en création).
    let avatarUrl: string | undefined;
    const documents: StudentDocument[] = [...existingDocs];

    const photoFile = photoRef.current?.files?.[0];
    const docFiles = Array.from(docsRef.current?.files ?? []);

    if (photoFile || docFiles.length > 0) {
      setUploading(true);
      try {
        if (photoFile) {
          const url = await uploadFile(photoFile, `${folder}/photo`);
          if (!url) { setUploading(false); setError("Échec de l'envoi de la photo."); return; }
          avatarUrl = url;
        }
        for (const f of docFiles) {
          const url = await uploadFile(f, `${folder}/docs`);
          if (!url) { setUploading(false); setError(`Échec de l'envoi du document « ${f.name} ».`); return; }
          documents.push({ name: f.name, url });
        }
      } catch {
        setUploading(false); setError("Échec de l'envoi des fichiers."); return;
      }
      setUploading(false);
    }

    const values: StudentFormValues = {
      ...fields,
      avatarUrl,
      documents,
      extraFields: extraFields.filter((f) => f.label.trim()),
    };

    startTransition(async () => {
      const res = studentId
        ? await updateStudentAction({ studentId, ...values })
        : await addStudentAction(values);
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return {
    editing,
    fields,
    set,
    extraFields, addExtra, setExtra, removeExtra,
    existingDocs, removeDoc,
    photoRef, docsRef, photoPreview, setPhotoPreview,
    error,
    pending, uploading,
    busy: pending || uploading,
    onSubmit,
  };
}
