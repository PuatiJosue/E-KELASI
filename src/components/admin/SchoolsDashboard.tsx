"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { KPI } from "@/components/KPI";
import { Donut, MRRChart } from "@/components/Charts";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import { InviteSchoolButton } from "@/components/admin/InviteSchoolModal";
import type { SchoolsAdminOverview } from "@/lib/admin/schools";

const DONUT_COLORS = ["#3A6DBC", "#1D6650", "#E0701E", "#9747BB", "#B8475B", "#C28728", "#4FA286", "#1E2F6D"];

const STATUS_LABEL: Record<string, { fr: string; en: string; cls: string }> = {
  active: { fr: "Active", en: "Active", cls: "success" },
  onboarding: { fr: "Onboarding", en: "Onboarding", cls: "info" },
  trial: { fr: "Essai", en: "Trial", cls: "warn" },
  suspended: { fr: "Suspendue", en: "Suspended", cls: "danger" },
  churned: { fr: "Partie", en: "Churned", cls: "danger" },
};

export function SchoolsDashboard({ data }: { data: SchoolsAdminOverview }) {
  const lang = useLang();
  const frEn = (fr: string, en: string) => (lang === "en" ? en : fr);
  const { kpis, schools: allSchools, distribution, dailyActivity, recentDocuments } = data;

  // Les écoles archivées (statut « Partie ») sortent de la liste par défaut,
  // sans disparaître : on peut les réafficher pour les rouvrir ou les réactiver.
  const [showArchived, setShowArchived] = useState(false);
  const archivedCount = useMemo(() => allSchools.filter((s) => s.status === "churned").length, [allSchools]);
  const schools = useMemo(
    () => (showArchived ? allSchools : allSchools.filter((s) => s.status !== "churned")),
    [allSchools, showArchived]
  );

  const totals = useMemo(
    () => ({
      students: schools.reduce((a, s) => a + s.students, 0),
      parents: schools.reduce((a, s) => a + s.parents, 0),
      messages: schools.reduce((a, s) => a + s.messages, 0),
      documents: schools.reduce((a, s) => a + s.documents, 0),
    }),
    [schools]
  );

  const exportCsv = () => {
    const header = ["École", "Ville", "Élèves", "Parents connectés", "Messages", "Documents", "Statut"];
    const lines = [
      header,
      ...schools.map((s) => [s.name, s.city, s.students, s.parents, s.messages, s.documents, STATUS_LABEL[s.status]?.fr ?? s.status]),
      ["TOTAL", "", totals.students, totals.parents, totals.messages, totals.documents, ""],
    ];
    const csv = lines.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ecoles-partenaires.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const esc = (s: unknown) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  const exportPdf = () => {
    const body = schools
      .map(
        (s) =>
          `<tr><td>${esc(s.name)}</td><td>${esc(s.city)}</td><td class="c">${s.students}</td><td class="c">${s.parents}</td><td class="c">${s.messages}</td><td class="c">${s.documents}</td><td>${esc(STATUS_LABEL[s.status]?.fr ?? s.status)}</td></tr>`
      )
      .join("");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Écoles partenaires</title>
<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}body{margin:32px;color:#1a1a2e}
h1{font-size:18px;margin:0 0 2px}.sub{color:#666;font-size:12px;margin-bottom:18px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#1f3a8a;color:#fff;text-align:left;padding:7px 8px;text-transform:uppercase;font-size:9.5px}
td{padding:7px 8px;border-bottom:1px solid #e5e7eb}td.c{text-align:center}
tfoot td{font-weight:700;border-top:2px solid #1a1410}</style></head><body>
<h1>Écoles partenaires</h1>
<div class="sub">${kpis.activeSchools}/${kpis.totalSchools} écoles actives · ${kpis.totalStudents} élèves · ${kpis.connectedParents} parents connectés</div>
<table><thead><tr><th>École</th><th>Ville</th><th>Élèves</th><th>Parents</th><th>Messages</th><th>Documents</th><th>Statut</th></tr></thead>
<tbody>${body}</tbody>
<tfoot><tr><td>TOTAL</td><td></td><td class="c">${totals.students}</td><td class="c">${totals.parents}</td><td class="c">${totals.messages}</td><td class="c">${totals.documents}</td><td></td></tr></tfoot>
</table>
<script>window.onload=function(){window.print()}</script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      alert("Autorisez les fenêtres pop-up pour générer le PDF.");
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  const donutTotal = distribution.reduce((a, d) => a + d.students, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI cards */}
      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <KPI label={<T fr="Écoles actives" en="Active schools" />} value={`${kpis.activeSchools}`} sub={<T fr={`${kpis.totalSchools} au total`} en={`${kpis.totalSchools} total`} />} />
        <KPI label={<T fr="Élèves totaux" en="Total students" />} value={kpis.totalStudents.toLocaleString("fr-FR")} accent="var(--brand-600)" />
        <KPI label={<T fr="Parents connectés" en="Connected parents" />} value={kpis.connectedParents.toLocaleString("fr-FR")} accent="var(--accent)" sub={<T fr={`${kpis.parentsActivePct}% actifs`} en={`${kpis.parentsActivePct}% active`} />} />
        <KPI label={<T fr="Messages envoyés" en="Messages sent" />} value={kpis.messagesThisMonth.toLocaleString("fr-FR")} sub={<T fr="ce mois" en="this month" />} />
        <KPI label={<T fr="Documents partagés" en="Documents shared" />} value={kpis.documentsShared.toLocaleString("fr-FR")} accent="var(--info)" />
        <KPI label={<T fr="Bugs signalés" en="Reported bugs" />} value={kpis.bugs.toLocaleString("fr-FR")} accent="var(--danger)" />
      </div>

      {/* Donut + activité */}
      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14 }}>
        <div className="ek-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Répartition des élèves par école" en="Students per school" />
          </div>
          {donutTotal === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
              <T fr="Aucun élève." en="No student." />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14 }}>
              <Donut segments={distribution.map((d, i) => ({ value: d.students, color: DONUT_COLORS[i % DONUT_COLORS.length] }))} size={120} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                {distribution.slice(0, 6).map((d, i) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--ink-3)" }}>{d.students} · {Math.round((d.students / donutTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ek-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Activité sur la plateforme" en="Platform activity" />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
            <T fr="Notifications par jour · ce mois" en="Notifications per day · this month" />
          </div>
          <div style={{ marginTop: 12 }}>
            {dailyActivity.some((v) => v > 0) ? (
              <MRRChart values={dailyActivity} w={520} h={180} />
            ) : (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
                <T fr="Pas encore d'activité ce mois." en="No activity this month yet." />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Derniers documents partagés */}
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
          <T fr="Derniers documents partagés" en="Recently shared documents" />
        </div>
        {recentDocuments.length === 0 ? (
          <div style={{ padding: 28, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
            <T fr="Aucun document partagé pour l'instant." en="No shared document yet." />
          </div>
        ) : (
          recentDocuments.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--brand-soft)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="file" size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                  {d.schoolName} · {d.kind === "annonce" ? frEn("Annonce", "Announcement") : frEn("Fiche école", "School file")} · {d.dateFr}
                </div>
              </div>
              {d.url && (
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 11.5 }}>
                  <Icon name="download" size={12} /> <T fr="Ouvrir" en="Open" />
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {/* Table écoles + export */}
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Toutes les écoles" en="All schools" />
          </div>
          {archivedCount > 0 && (
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-3)", cursor: "pointer" }}>
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              {frEn(`Afficher les archivées (${archivedCount})`, `Show archived (${archivedCount})`)}
            </label>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={exportCsv} disabled={schools.length === 0} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12, opacity: schools.length === 0 ? 0.5 : 1 }}>
              <Icon name="download" size={13} /> Excel
            </button>
            <button onClick={exportPdf} disabled={schools.length === 0} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12, opacity: schools.length === 0 ? 0.5 : 1 }}>
              <Icon name="file" size={13} /> PDF
            </button>
          </div>
        </div>

        <div className="ek-tablewrap">
          <div style={{ minWidth: 820 }}>
            <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.05em", textTransform: "uppercase", background: "var(--surface-2)" }}>
              <div><T fr="École" en="School" /></div>
              <div><T fr="Ville" en="City" /></div>
              <div style={{ textAlign: "center" }}><T fr="Élèves" en="Students" /></div>
              <div style={{ textAlign: "center" }}><T fr="Parents" en="Parents" /></div>
              <div style={{ textAlign: "center" }}><T fr="Messages" en="Messages" /></div>
              <div style={{ textAlign: "center" }}><T fr="Documents" en="Documents" /></div>
              <div><T fr="Statut" en="Status" /></div>
              <div style={{ textAlign: "right" }}><T fr="Action" en="Action" /></div>
            </div>
            {schools.length === 0 ? (
              <div style={{ padding: 36, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                <T fr="Aucune école." en="No school." />
              </div>
            ) : (
              <>
                {schools.map((s, i) => {
                  const st = STATUS_LABEL[s.status] ?? { fr: s.status, en: s.status, cls: "" };
                  return (
                    <div key={s.id} style={{ display: "grid", gridTemplateColumns: GRID, padding: "12px 18px", alignItems: "center", fontSize: 12.5, borderTop: "1px solid var(--divider)" }}>
                      <div style={{ fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ color: "var(--ink-3)" }}>{s.city}</div>
                      <div style={{ textAlign: "center", color: "var(--ink-2)" }}>{s.students}</div>
                      <div style={{ textAlign: "center", color: "var(--ink-2)" }}>{s.parents}</div>
                      <div style={{ textAlign: "center", color: "var(--ink-2)" }}>{s.messages}</div>
                      <div style={{ textAlign: "center", color: "var(--ink-2)" }}>{s.documents}</div>
                      <div><span className={`ek-chip ${st.cls}`}>{frEn(st.fr, st.en)}</span></div>
                      <div style={{ textAlign: "right" }}>
                        <Link href={`/schools/${s.id}`} style={{ color: "var(--brand-600)", fontSize: 12, fontWeight: 600 }}>
                          <T fr="Voir" en="View" /> →
                        </Link>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "12px 18px", alignItems: "center", fontSize: 12.5, borderTop: "2px solid var(--border-strong)", fontWeight: 700, color: "var(--ink)" }}>
                  <div>Total</div>
                  <div />
                  <div style={{ textAlign: "center" }}>{totals.students}</div>
                  <div style={{ textAlign: "center" }}>{totals.parents}</div>
                  <div style={{ textAlign: "center" }}>{totals.messages}</div>
                  <div style={{ textAlign: "center" }}>{totals.documents}</div>
                  <div />
                  <div />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <div className="ek-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <Icon name="plus" size={18} stroke={2.4} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}><T fr="Inviter une école" en="Invite a school" /></div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}><T fr="Ajoutez une nouvelle école." en="Add a new school." /></div>
          <div style={{ marginTop: 4 }}><InviteSchoolButton /></div>
        </div>
        <QuickCard href="/year-archive" icon="file" titleFr="Rapports détaillés" titleEn="Detailed reports" descFr="Consultez les rapports d'activité." descEn="View activity reports." />
        <QuickCard href="/broadcast" icon="send" titleFr="Diffusion globale" titleEn="Broadcast" descFr="Message à toutes les écoles." descEn="Message all schools." />
        <QuickCard href="/security" icon="shield" titleFr="Logs & activité" titleEn="Logs & activity" descFr="Journaux et événements récents." descEn="Recent logs and events." />
      </div>
    </div>
  );
}

const GRID = "1.8fr 1.1fr 0.7fr 0.7fr 0.8fr 0.9fr 0.9fr 0.7fr";

function QuickCard({ href, icon, titleFr, titleEn, descFr, descEn }: { href: string; icon: string; titleFr: string; titleEn: string; descFr: string; descEn: string }) {
  return (
    <Link href={href} className="ek-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
      <Icon name={icon} size={18} stroke={2} />
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}><T fr={titleFr} en={titleEn} /></div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}><T fr={descFr} en={descEn} /></div>
    </Link>
  );
}
