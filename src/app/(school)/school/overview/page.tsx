import Link from "next/link";
import { KPI, PageHeader } from "@/components/KPI";
import { Bars, Donut, PerfChart } from "@/components/Charts";
import { Icon } from "@/components/Icon";
import { AgendaCard } from "@/components/school/AgendaCard";
import { T } from "@/lib/i18n";
import { getMySchool, getSchoolKpis, listClassesWithAvg, getGradeDistribution, getSchoolPerformance6m } from "@/lib/school-db";
import { getPlatformForSchools } from "@/lib/platform-db";
import { getSchoolActivity } from "@/lib/announce-db";
import { listUpcomingEvents } from "@/lib/agenda-db";
import { schoolYearLabel, currentTrimester } from "@/lib/trimester";

const CLASS_TINTS = ["blue", "violet", "teal", "amber", "rose", "green"] as const;
const TINT_BG: Record<string, string> = {
  blue: "var(--tint-blue-bg)", violet: "var(--tint-violet-bg)", teal: "var(--tint-teal-bg)",
  amber: "var(--tint-amber-bg)", rose: "var(--tint-rose-bg)", green: "var(--tint-green-bg)",
};
const TINT_INK: Record<string, string> = {
  blue: "var(--tint-blue-ink)", violet: "var(--tint-violet-ink)", teal: "var(--tint-teal-ink)",
  amber: "var(--tint-amber-ink)", rose: "var(--tint-rose-ink)", green: "var(--tint-green-ink)",
};

export default async function SchoolOverview() {
  const [school, kpis, classes, platform, dist, activity, perf, events] = await Promise.all([
    getMySchool(),
    getSchoolKpis(),
    listClassesWithAvg(),
    getPlatformForSchools(),
    getGradeDistribution(),
    getSchoolActivity(6),
    getSchoolPerformance6m(),
    listUpcomingEvents(6),
  ]);

  const hasPerf = perf.some((p) => p.avg !== null || p.attendancePct !== null);

  const year = (school?.currentYear || schoolYearLabel()).replace("-", "–");
  const tri = currentTrimester();
  const planLabel = school?.plan === "pro" ? "Pro" : "Standard";
  const barData = classes
    .filter((c) => c.avg !== null)
    .slice(0, 6)
    .map((c) => ({ label: c.label.split("—")[0].trim().slice(0, 8), value: c.avg as number }));

  return (
    <div className="ek-hero" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        eyebrow={{
          fr: `Année scolaire ${year} · Trimestre ${tri}`,
          en: `School year ${year} · Term ${tri}`,
        }}
        title={{
          fr: `Bonjour, ${school?.name ?? "votre école"}.`,
          en: `Hello, ${school?.name ?? "your school"}.`,
        }}
        highlight={school?.name}
        sub={{
          fr: school ? `${school.city}, ${school.countryCode} · Plan ${planLabel}. Voici un aperçu de votre école aujourd'hui.` : "",
          en: school ? `${school.city}, ${school.countryCode} · ${planLabel} plan. Here is a snapshot of your school today.` : "",
        }}
        right={
          <>
            <Link href="/school/classes" className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 13 }}>
              <Icon name="file" size={15} stroke={2} />
              <T fr="Exporter le rapport" en="Export report" />
            </Link>
            <Link href="/school/classes" className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13 }}>
              <Icon name="plus" size={15} stroke={2.5} />
              <T fr="Inviter un prof" en="Invite teacher" />
            </Link>
          </>
        }
      />

      {platform.map((a) => (
        <div key={a.id} className="ek-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span className="ek-tint violet"><Icon name="bell" size={18} /></span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Annonce E-KLASS</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginTop: 1 }}>{a.title}</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.body}</div>
          </div>
        </div>
      ))}

      {/* KPI */}
      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        <KPI icon="graduation" tint="blue" label={<T fr="Élèves" en="Students" />} value={String(kpis.students)} sub={<T fr={`${kpis.classes} classes`} en={`${kpis.classes} classes`} />} />
        <KPI icon="users" tint="violet" label={<T fr="Professeurs" en="Teachers" />} value={String(kpis.teachers)} sub={<T fr="Dans votre école" en="In your school" />} />
        <KPI icon="users" tint="green" label={<T fr="Parents abonnés" en="Paying parents" />} value={String(kpis.parentsPaying)} sub={<T fr="Essai + actifs" en="Trial + active" />} />
        <KPI icon="clipboard" tint="amber" label={<T fr="Notes saisies ce mois" en="Grades this month" />} value={String(kpis.gradesThisMonth)} sub={<T fr="Par tous les profs" en="By all teachers" />} />
        <KPI icon="bookOpen" tint="rose" label={<T fr="Devoirs actifs" en="Active homework" />} value={String(kpis.homeworkActive)} sub={<T fr="À rendre" en="Pending" />} />
      </div>

      {/* Performance + Distribution */}
      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, alignItems: "stretch" }}>
        <div className="ek-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}><T fr="Performance de l'école" en="School performance" /></div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}><T fr="Moyenne générale & taux de présence — 6 derniers mois" en="Overall average & attendance rate — last 6 months" /></div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--ink-2)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: "#4F66E8" }} /><T fr="Moyenne /20" en="Average /20" /></span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: "#14B8A6" }} /><T fr="Présence %" en="Attendance %" /></span>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            {hasPerf ? (
              <PerfChart points={perf} h={220} />
            ) : (
              <div style={{ padding: "56px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
                <T fr="Pas encore assez de données pour tracer la courbe." en="Not enough data yet to draw the chart." />
              </div>
            )}
          </div>
        </div>

        <div className="ek-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}><T fr="Distribution des notes" en="Grade distribution" /></div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}><T fr="Trimestre en cours" en="Current term" /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
              <Donut segments={dist.bands.map((b) => ({ value: b.count, color: b.color }))} size={120} stroke={18} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--ink)" }}>{dist.total}</div>
                <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}><T fr="élèves" en="students" /></div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 130, display: "flex", flexDirection: "column", gap: 7 }}>
              {dist.bands.map((b) => (
                <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: b.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: "var(--ink-2)" }}><T fr={b.fr} en={b.en} /></span>
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>{dist.total > 0 ? Math.round((b.count / dist.total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Classes + Agenda */}
      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, alignItems: "start" }}>
        <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}><T fr="Classes" en="Classes" /></div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}><T fr="Vue d'ensemble par classe" en="Per-class overview" /></div>
            </div>
            <Link href="/school/students" style={{ color: "var(--brand)", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
              <T fr="Tout voir" en="See all" /> <Icon name="chevR" size={13} />
            </Link>
          </div>
          {classes.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
              <T fr="Aucune classe pour l'instant." en="No class yet." />
            </div>
          ) : (
            classes.map((c, i) => {
              const tint = CLASS_TINTS[i % CLASS_TINTS.length];
              return (
                <div
                  key={c.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "14px 20px",
                    borderTop: i > 0 ? "1px solid var(--divider)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        background: TINT_BG[tint],
                        color: TINT_INK[tint],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 12,
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {c.label.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{c.label}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{c.studentCount} <T fr="élèves" en="students" /></div>
                    </div>
                  </div>
                  <div>
                    {c.avg !== null ? (
                      <span className={`ek-chip ${c.avg >= 14 ? "success" : c.avg >= 10 ? "warn" : "danger"}`}>
                        {c.avg.toFixed(1)}/20
                      </span>
                    ) : (
                      <span className="ek-chip"><T fr="Pas de notes" en="No grades" /></span>
                    )}
                  </div>
                  <Link href="/school/students" style={{ color: "var(--brand)", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <T fr="Détails" en="Details" /> <Icon name="chevR" size={12} />
                  </Link>
                </div>
              );
            })
          )}
        </div>

        <AgendaCard events={events} />
      </div>

      {/* Moyenne par classe + Activité récente */}
      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, alignItems: "start" }}>
        <div className="ek-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}><T fr="Moyenne par classe" en="Average by class" /></div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, marginBottom: 14 }}><T fr="Toutes classes confondues" en="All classes" /></div>
          {barData.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
              <T fr="Pas encore de notes pour afficher les moyennes." en="No grades yet to show averages." />
            </div>
          ) : (
            <Bars data={barData} max={20} h={200} />
          )}
        </div>

        <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}><T fr="Activité récente" en="Recent activity" /></div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}><T fr="Dernières actions de l'équipe" en="Latest team actions" /></div>
          </div>
          {activity.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
              <T fr="Aucune activité récente." en="No recent activity." />
            </div>
          ) : (
            activity.map((it, i) => (
              <div key={it.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "13px 20px", borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
                <span className={`ek-tint ${it.tint}`} style={{ width: 32, height: 32, borderRadius: 10 }}><Icon name={it.icon} size={15} /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.4 }}><T fr={it.fr} en={it.en} /></div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{it.rel}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
