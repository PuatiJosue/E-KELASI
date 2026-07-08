"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { RequestActions } from "./RequestActions";
import type { PendingStudent } from "./actions";

function fmtBirth(birth: string | null): { date: string; age: string } {
  if (!birth) return { date: "—", age: "—" };
  const d = new Date(birth);
  if (isNaN(d.getTime())) return { date: "—", age: "—" };
  const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return { date, age: age >= 0 && age < 100 ? `${age} ans` : "—" };
}

const sexLabel = (s: string | null) => (s === "M" ? "Masculin" : s === "F" ? "Féminin" : "—");
const relLabel = (r: string | null) => {
  if (!r) return "—";
  const map: Record<string, string> = { parent: "Parent", father: "Père", mother: "Mère", pere: "Père", mere: "Mère", tuteur: "Tuteur", guardian: "Tuteur" };
  return map[r.toLowerCase()] ?? r;
};

export function PendingRequestsList({ pending }: { pending: PendingStudent[] }) {
  if (pending.length === 0) {
    return (
      <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
        <T fr="Aucune demande en attente." en="No pending request." />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {pending.map((p) => (
        <RequestCard key={p.id} p={p} />
      ))}
    </div>
  );
}

function RequestCard({ p }: { p: PendingStudent }) {
  const [open, setOpen] = useState(false);
  const birth = fmtBirth(p.birthDate);

  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* En-tête cliquable */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }}
      >
        <Avatar name={p.fullName} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{p.fullName}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
            {sexLabel(p.sex)} · {birth.age} · {p.className ?? "—"}
            {p.option ? ` · ${p.option}` : ""}
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginRight: 6, whiteSpace: "nowrap" }}>
          <T fr="Demande du" en="Requested" /> {p.createdAt}
        </div>
        <span style={{ display: "inline-flex", color: "var(--brand-600)", fontSize: 12, fontWeight: 600, gap: 4, alignItems: "center", whiteSpace: "nowrap" }}>
          <Icon name={open ? "chevU" : "chevD"} size={15} />
          {open ? <T fr="Masquer" en="Hide" /> : <T fr="Détails" en="Details" />}
        </span>
      </div>

      {/* Détails complets saisis par le parent */}
      {open && (
        <div style={{ padding: "4px 18px 16px", borderTop: "1px solid var(--divider)" }}>
          <Section title={<T fr="Élève (saisi par le parent)" en="Student (entered by parent)" />}>
            <Detail label={<T fr="Nom" en="Last name" />} value={p.lastName} />
            <Detail label={<T fr="Post-nom" en="Middle name" />} value={p.middleName} />
            <Detail label={<T fr="Prénom" en="First name" />} value={p.firstName} />
            <Detail label={<T fr="Sexe" en="Sex" />} value={sexLabel(p.sex)} />
            <Detail label={<T fr="Date de naissance" en="Birth date" />} value={birth.date} />
            <Detail label={<T fr="Âge" en="Age" />} value={birth.age} />
            <Detail label={<T fr="Classe demandée" en="Requested class" />} value={p.className} />
            <Detail label={<T fr="Option / filière" en="Option" />} value={p.option} />
            <Detail label={<T fr="Adresse de résidence" en="Home address" />} value={p.address} full />
          </Section>

          <Section title={<T fr="Parent demandeur" en="Requesting parent" />}>
            <Detail label={<T fr="Nom du parent" en="Parent name" />} value={p.parentName} />
            <Detail label={<T fr="Lien de parenté" en="Relationship" />} value={relLabel(p.parentRelation)} />
            <Detail label={<T fr="Téléphone" en="Phone" />} value={p.parentPhone} />
            <Detail label={<T fr="E-mail" en="Email" />} value={p.parentEmail || null} />
          </Section>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <RequestActions studentId={p.id} duplicate={p.possibleDuplicate} />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px 18px" }}>
        {children}
      </div>
    </div>
  );
}

function Detail({ label, value, full }: { label: React.ReactNode; value: string | null; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>{value && value.trim() ? value : "—"}</div>
    </div>
  );
}
