"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { StudentFormModal } from "@/components/school/StudentFormModal";

export function AddStudentButton({ classNames = [] }: { classNames?: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13 }}>
        <Icon name="plus" size={15} stroke={2.5} />
        <T fr="Ajouter un élève" en="Add student" />
      </button>

      {open && <StudentFormModal classNames={classNames} onClose={() => setOpen(false)} />}
    </>
  );
}
