"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { StudentRow, StudentAttendanceMap } from "@/lib/teacher-db";
import { saveAttendanceAction } from "@/app/(teacher)/teacher/attendance/actions";

type ClassOption = { key: string; label: string; className: string; option: string | null };

type Props = {
  classes: ClassOption[];
  initialClassName: string;
  initialOption: string;
  initialDate: string;
  initialStudents: StudentRow[];
  initialAttendance: StudentAttendanceMap;
};

type Status = "present" | "absent" | "late" | "justified";

const STATUSES: { value: Status; fr: string; en: string; color: string }[] = [
  { value: "present",   fr: "Présent",   en: "Present",   color: "#1F9D6B" },
  { value: "absent",    fr: "Absent",    en: "Absent",    color: "#C0433A" },
  { value: "late",      fr: "Retard",    en: "Late",      color: "#C0843A" },
  { value: "justified", fr: "Justifié",  en: "Excused",   color: "#3A6DBC" },
];

export function AttendanceForm({ classes, initialClassName, initialOption, initialDate, initialStudents, initialAttendance }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [classSel, setClassSel] = useState(() => {
    const c = classes.find((c) => c.className === initialClassName && (c.option ?? "") === (initialOption ?? ""));
    return c?.key ?? classes[0]?.key ?? "";
  });
  const [date, setDate] = useState(initialDate);
  const [statuses, setStatuses] = useState<Record<string, Status>>(initialAttendance as Record<string, Status>);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const students = initialStudents;
  const markedCount = students.filter((s) => statuses[s.id]).length;

  const reload = (key: string, nextDate: string) => {
    const c = classes.find((c) => c.key === key);
    router.replace(
      `/teacher/attendance?class=${encodeURIComponent(c?.className ?? "")}&option=${encodeURIComponent(c?.option ?? "")}&date=${encodeURIComponent(nextDate)}`
    );
  };

  const onChangeClass = (key: string) => {
    setClassSel(key);
    setSuccess(null);
    reload(key, date);
  };
  const onChangeDate = (d: string) => {
    setDate(d);
    setSuccess(null);
    reload(classSel, d);
  };

  const setStatus = (studentId: string, status: Status) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };
  const markAllPresent = () => {
    const next: Record<string, Status> = { ...statuses };
    for (const s of students) next[s.id] = "present";
    setStatuses(next);
  };

  const onSubmit = () => {
    setError(null);
    setSuccess(null);
    const items = students
      .filter((s) => statuses[s.id])
      .map((s) => ({ studentId: s.id, status: statuses[s.id] }));
    if (items.length === 0) {
      setError("Pointe au moins un élève.");
      return;
    }
    startTransition(async () => {
      const res = await saveAttendanceAction({ date, items });
      if (res.ok) {
        setSuccess(`${res.count} présence${res.count > 1 ? "s" : ""} enregistrée${res.count > 1 ? "s" : ""}.`);
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <>
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Selector
            label={<T fr="Classe" en="Class" />}
            value={classSel}
            onChange={onChangeClass}
            options={classes.map((c) => ({ value: c.key, label: c.label }))}
          />
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={labelStyle}><T fr="Date" en="Date" /></span>
            <input type="date" value={date} onChange={(e) => onChangeDate(e.target.value)} style={fieldStyle} />
          </label>
        </div>
      </div>

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
              <T fr="Appel" en="Roll call" />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
              {markedCount}/{students.length} <T fr="élèves pointés" en="students marked" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={markAllPresent}
              disabled={students.length === 0}
              className="ek-btn ek-btn-outline"
              style={{ height: 34, fontSize: 12.5, opacity: students.length === 0 ? 0.5 : 1 }}
            >
              <Icon name="check" size={14} stroke={2.5} />
              <T fr="Tout présent" en="All present" />
            </button>
            <button
              onClick={onSubmit}
              disabled={pending || markedCount === 0}
              className="ek-btn ek-btn-primary"
              style={{ height: 34, fontSize: 12.5, opacity: pending || markedCount === 0 ? 0.5 : 1 }}
            >
              {pending ? "Envoi…" : `Enregistrer ${markedCount > 0 ? `(${markedCount})` : ""}`}
            </button>
          </div>
        </div>

        {success && (
          <div style={{ padding: "10px 18px", background: "var(--accent-50)", color: "var(--accent)", fontSize: 12.5, fontWeight: 600, borderBottom: "1px solid var(--divider)" }}>
            ✓ {success}
          </div>
        )}
        {error && (
          <div style={{ padding: "10px 18px", background: "rgba(192,58,43,0.08)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600, borderBottom: "1px solid var(--divider)" }}>
            ⚠ {error}
          </div>
        )}

        <div className="ek-tablewrap">
        <div style={{ minWidth: 520 }}>
        {students.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            <T fr="Aucun élève dans cette classe." en="No students in this class." />
          </div>
        ) : (
          students.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                gap: 12,
                padding: "10px 18px",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: i < students.length - 1 ? "1px solid var(--divider)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ color: "var(--ink-3)", fontSize: 12, fontFamily: "var(--font-display)", width: 18 }}>{i + 1}</span>
                <Avatar name={s.fullName} size={30} />
                <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.fullName}</span>
                <SexBadge sex={s.sex} />
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {STATUSES.map((st) => {
                  const on = statuses[s.id] === st.value;
                  return (
                    <button
                      key={st.value}
                      onClick={() => setStatus(s.id, st.value)}
                      title={st.fr}
                      style={{
                        padding: "6px 11px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: `1px solid ${on ? st.color : "var(--border-strong)"}`,
                        background: on ? st.color : "var(--surface)",
                        color: on ? "#fff" : "var(--ink-2)",
                      }}
                    >
                      <T fr={st.fr} en={st.en} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
        </div>
        </div>
      </div>
    </>
  );
}

function SexBadge({ sex }: { sex: string | null }) {
  if (sex !== "M" && sex !== "F") return null;
  const isM = sex === "M";
  return (
    <span
      title={isM ? "Masculin" : "Féminin"}
      style={{
        flexShrink: 0,
        width: 17,
        height: 17,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        color: "#fff",
        background: isM ? "#2563EB" : "#DB2777",
      }}
    >
      {isM ? "M" : "F"}
    </span>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={labelStyle}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={fieldStyle}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--ink-3)",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const fieldStyle: React.CSSProperties = {
  padding: "9px 10px",
  borderRadius: 8,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 13,
  fontFamily: "inherit",
};
