"use client";

// Aperçu plein écran du calendrier de la classe.

import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { WeekCalendar } from "./WeekCalendar";
import type { Row } from "./timetable-shared";

export function PreviewOverlay({ rows, className, option, onClose }: {
  rows: Row[];
  className: string;
  option: string;
  onClose: () => void;
}) {
  return (
    <div onClick={() => onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="ek-card" style={{ width: "100%", maxWidth: 1040, maxHeight: "92vh", overflow: "auto", padding: 0 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
            {className.trim()}{option ? ` · ${option}` : ""}
          </div>
          <button onClick={() => onClose()} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12, marginLeft: "auto" }}>
            <Icon name="close" size={14} /> <T fr="Fermer" en="Close" />
          </button>
        </div>
        <WeekCalendar rows={rows} />
      </div>
    </div>
  );
}
