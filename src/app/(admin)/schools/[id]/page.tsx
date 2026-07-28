import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, KPI } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { SchoolArchiveButton } from "@/components/admin/SchoolArchiveButton";
import { SchoolBillingCard } from "@/components/admin/SchoolBillingCard";
import { getSchoolDossier } from "@/lib/admin/school-dossier";

const STATUS_LABEL: Record<string, { fr: string; cls: string }> = {
  active: { fr: "Active", cls: "success" },
  onboarding: { fr: "Onboarding", cls: "info" },
  trial: { fr: "Essai", cls: "warn" },
  suspended: { fr: "Suspendue", cls: "danger" },
  churned: { fr: "Partie", cls: "danger" },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "9px 0", borderTop: "1px solid var(--divider)" }}>
      <div style={{ width: 150, flexShrink: 0, fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: "var(--ink)", minWidth: 0, wordBreak: "break-word" }}>{value || "—"}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
        {title}
      </div>
      <div style={{ padding: "6px 18px 14px" }}>{children}</div>
    </div>
  );
}

export default async function SchoolDossierPage({ params }: { params: { id: string } }) {
  const d = await getSchoolDossier(params.id);
  if (!d) notFound();

  const st = STATUS_LABEL[d.status] ?? { fr: d.status, cls: "" };
  const fullAddress = [d.address, d.quartier, d.commune, d.city, d.countryCode].filter(Boolean).join(", ");

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <Link href="/schools" style={{ fontSize: 12.5, color: "var(--brand-600)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Icon name="chevL" size={14} /> Toutes les écoles
      </Link>

      <PageHeader
        title={{ fr: d.name, en: d.name }}
        sub={{ fr: `${d.city}${d.directorName ? ` · Direction : ${d.directorName}` : ""}`, en: `${d.city}${d.directorName ? ` · Director: ${d.directorName}` : ""}` }}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className={`ek-chip ${st.cls}`}>{st.fr}</span>
            <SchoolArchiveButton
              schoolId={params.id}
              schoolName={d.name}
              archived={d.status === "churned"}
              students={d.counts.students}
            />
          </div>
        }
      />

      {/* KPI */}
      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        <KPI label="Élèves" value={String(d.counts.students)} sub={d.counts.pending > 0 ? `${d.counts.pending} en attente` : undefined} />
        <KPI label="Parents connectés" value={String(d.counts.parents)} accent="var(--accent)" />
        <KPI label="Personnel" value={String(d.counts.teachers)} accent="var(--brand-600)" />
        <KPI label="Classes" value={String(d.counts.classes)} accent="var(--info)" />
        <KPI label="Documents" value={String(d.counts.documents)} />
      </div>

      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Identité */}
        <Card title="Fiche de l'école">
          <InfoRow label="Nom" value={d.name} />
          <InfoRow label="Directeur / Direction" value={d.directorName} />
          <InfoRow label="Email" value={d.email ? <a href={`mailto:${d.email}`} style={{ color: "var(--brand-600)" }}>{d.email}</a> : null} />
          <InfoRow label="Téléphone" value={d.phone ? <a href={`tel:${d.phone}`} style={{ color: "var(--brand-600)" }}>{d.phone}</a> : null} />
          <InfoRow label="Adresse" value={fullAddress} />
          <InfoRow label="Plan" value={d.plan === "pro" ? "Pro" : "Standard"} />
          <InfoRow label="Statut" value={<span className={`ek-chip ${st.cls}`}>{st.fr}</span>} />
          <InfoRow label="Année scolaire" value={d.currentYear} />
          <InfoRow label="Inscrite le" value={d.joinedFr} />
          {d.notes ? <InfoRow label="Notes" value={d.notes} /> : null}
        </Card>

        {/* Codes d'accès */}
        <Card title="Codes d'accès direction">
          {d.accessCodes.length === 0 ? (
            <div style={{ padding: "14px 0", color: "var(--ink-3)", fontSize: 12.5 }}>Aucun code d&apos;accès généré.</div>
          ) : (
            d.accessCodes.map((c, i) => (
              <div key={c.code + i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid var(--divider)" }}>
                <code style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.05em" }}>{c.code}</code>
                <span style={{ marginLeft: "auto" }} className={`ek-chip ${c.redeemed ? "" : "warn"}`}>
                  {c.redeemed ? `Utilisé${c.redeemedFr ? ` · ${c.redeemedFr}` : ""}` : "Non utilisé"}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Abonnement : encaissement hors Stripe + suspension */}
      <SchoolBillingCard schoolId={params.id} status={d.status} billing={d.billing} />

      {/* Classes */}
      <Card title="Classes">
        {d.classes.length === 0 ? (
          <div style={{ padding: "14px 0", color: "var(--ink-3)", fontSize: 12.5 }}>Aucune classe avec élèves actifs.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 8 }}>
            {d.classes.map((c) => (
              <span key={c.label} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 9, background: "var(--surface-2)", fontSize: 12, color: "var(--ink-2)" }}>
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{c.label}</span>
                <span style={{ color: "var(--ink-3)" }}>· {c.students} élève{c.students > 1 ? "s" : ""}</span>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Personnel */}
      <Card title="Personnel">
        {d.staff.length === 0 ? (
          <div style={{ padding: "14px 0", color: "var(--ink-3)", fontSize: 12.5 }}>Aucun membre du personnel.</div>
        ) : (
          d.staff.map((s, i) => (
            <div key={(s.email ?? s.name) + i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 10, alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--divider)", fontSize: 12.5 }}>
              <div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
              <div style={{ color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email ?? "—"}</div>
              <div><span className={`ek-chip ${s.role === "school_admin" ? "brand" : ""}`}>{s.role === "school_admin" ? "Direction" : "Professeur"}</span></div>
              <div style={{ color: "var(--ink-3)", textAlign: "right" }}>{s.joinedFr ?? "—"}</div>
            </div>
          ))
        )}
      </Card>

      {/* Documents */}
      <Card title="Documents partagés">
        {d.documents.length === 0 ? (
          <div style={{ padding: "14px 0", color: "var(--ink-3)", fontSize: 12.5 }}>Aucun document partagé.</div>
        ) : (
          d.documents.map((doc, i) => (
            <div key={doc.name + i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--divider)" }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="file" size={14} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{doc.dateFr}</div>
              </div>
              {doc.url && (
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 11.5 }}>
                  <Icon name="download" size={12} /> Ouvrir
                </a>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
