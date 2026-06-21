import Link from "next/link";
import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { listStudentsInClass } from "@/lib/teacher-db";
import { TRIMESTERS, currentTrimester, trimesterMeta } from "@/lib/trimester";

export default async function ClassDetail({
  params,
  searchParams,
}: {
  params: { class: string };
  searchParams: { t?: string };
}) {
  const className = decodeURIComponent(params.class);
  const selectedTri = Number(searchParams.t) || currentTrimester();
  const students = await listStudentsInClass(className, selectedTri);
  const triMeta = trimesterMeta(selectedTri);

  const avgClass = students.length > 0 && students.some((s) => s.avg !== null)
    ? +(students.reduce((acc, s) => acc + (s.avg ?? 0), 0) / students.filter((s) => s.avg !== null).length).toFixed(1)
    : null;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: className, en: className }}
        sub={{
          fr: `${students.length} élèves · ${triMeta.fr}${avgClass !== null ? ` · moyenne classe ${avgClass}/20` : ""}`,
          en: `${students.length} students · ${triMeta.en}${avgClass !== null ? ` · class avg ${avgClass}/20` : ""}`,
        }}
        right={
          <Link
            href={`/teacher/grades?class=${encodeURIComponent(className)}`}
            className="ek-btn ek-btn-primary"
            style={{ height: 32, fontSize: 12 }}
          >
            <Icon name="plus" size={14} stroke={2.5} />
            <T fr="Saisir des notes" en="Enter grades" />
          </Link>
        }
      />

      {/* Sélecteur de trimestre : les cotes affichées (moyennes) sont celles du trimestre choisi. */}
      <div style={{ display: "flex", gap: 4, alignItems: "center", background: "var(--surface-2)", borderRadius: 9, padding: 3, alignSelf: "flex-start" }}>
        {TRIMESTERS.map((m) => {
          const on = m.index === selectedTri;
          return (
            <Link
              key={m.index}
              href={`/teacher/classes/${encodeURIComponent(className)}?t=${m.index}`}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 7,
                color: on ? "var(--ink)" : "var(--ink-3)",
                background: on ? "var(--surface)" : "transparent",
              }}
            >
              {m.short}
            </Link>
          );
        })}
      </div>

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="ek-tablewrap">
        <div style={{ minWidth: 480 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.6fr 2fr 1fr 1fr",
            padding: "12px 18px",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink-3)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>#</div>
          <div><T fr="Élève" en="Student" /></div>
          <div style={{ textAlign: "right" }}><T fr="Moyenne" en="Average" /></div>
          <div></div>
        </div>
        {students.map((s, i) => (
          <div
            key={s.id}
            style={{
              display: "grid",
              gridTemplateColumns: "0.6fr 2fr 1fr 1fr",
              padding: "12px 18px",
              alignItems: "center",
              fontSize: 12.5,
              borderBottom: i < students.length - 1 ? "1px solid var(--divider)" : "none",
            }}
          >
            <div style={{ color: "var(--ink-3)", fontFamily: "var(--font-display)" }}>{i + 1}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={s.fullName} url={s.avatarUrl} size={32} />
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{s.fullName}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              {s.avg !== null ? (
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                  {s.avg}<span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 600 }}>/20</span>
                </span>
              ) : (
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>—</span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button style={{ color: "var(--ink-3)", padding: 6, borderRadius: 6 }}>
                <Icon name="chevR" size={16} />
              </button>
            </div>
          </div>
        ))}
        {students.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            <T fr="Aucun élève dans cette classe." en="No students in this class." />
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
