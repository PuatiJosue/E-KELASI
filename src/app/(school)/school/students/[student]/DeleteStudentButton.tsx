"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { deleteStudentAction } from "@/app/(school)/school/students/actions";

export function DeleteStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const remove = () => {
    const ok = window.confirm(
      `Supprimer définitivement « ${studentName} » ?\n\nSes notes, présences et le lien avec ses parents seront supprimés. L'élève disparaîtra aussi de l'application des parents. Cette action est irréversible.`
    );
    if (!ok) return;
    start(async () => {
      const res = await deleteStudentAction(studentId);
      if (res.ok) router.push("/school/students");
      else alert(res.message);
    });
  };

  return (
    <button
      onClick={remove}
      disabled={pending}
      className="ek-btn ek-btn-outline"
      style={{ height: 32, fontSize: 12, color: "var(--danger)", borderColor: "var(--danger)", opacity: pending ? 0.6 : 1 }}
    >
      <Icon name="trash" size={13} />
      {pending ? "…" : <T fr="Supprimer" en="Delete" />}
    </button>
  );
}
