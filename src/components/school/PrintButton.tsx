"use client";

import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}>
      <Icon name="download" size={14} />
      <T fr="Imprimer / Sauvegarder PDF" en="Print / Save PDF" />
    </button>
  );
}
