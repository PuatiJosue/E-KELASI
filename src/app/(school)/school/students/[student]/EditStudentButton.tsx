"use client";

// Ouvre la fiche de renseignements pré-remplie pour modifier un élève existant.

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { StudentFormModal, type StudentFormInitial } from "@/components/school/StudentFormModal";

export function EditStudentButton({
  studentId,
  initial,
  classNames = [],
}: {
  studentId: string;
  initial: StudentFormInitial;
  classNames?: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
        <Icon name="edit" size={13} />
        <T fr="Modifier" en="Edit" />
      </button>

      {open && (
        <StudentFormModal
          studentId={studentId}
          initial={initial}
          classNames={classNames}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
