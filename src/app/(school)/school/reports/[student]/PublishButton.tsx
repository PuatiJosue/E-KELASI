"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useLang } from "@/lib/i18n";
import { publishBulletinAction } from "../actions";

export function PublishButton({ studentId, period, trimester, hasSignature }: { studentId: string; period: string; trimester?: number; hasSignature: boolean }) {
  const lang = useLang();
  const en = lang === "en";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  const publish = () => {
    if (!confirm(en ? "Publish this signed report card to parents?" : "Publier ce bulletin signé aux parents ?")) return;
    startTransition(async () => {
      const r = await publishBulletinAction(studentId, period, trimester);
      if (r.ok) { setDone(r.code); router.refresh(); }
      else alert(r.message);
    });
  };

  if (done) {
    return (
      <span style={{ fontSize: 12, color: "#1D6650", fontWeight: 700 }}>
        {en ? "✅ Published · code " : "✅ Publié · code "}{done}
      </span>
    );
  }

  return (
    <button onClick={publish} disabled={pending} className="ek-btn ek-btn-primary report-toolbar" style={{ height: 32, fontSize: 12, opacity: pending ? 0.6 : 1 }} title={hasSignature ? "" : (en ? "Tip: set up your signature in Settings" : "Astuce : configurez votre signature dans Paramètres")}>
      <Icon name="check" size={13} />
      {pending ? (en ? "Publishing…" : "Publication…") : (en ? "Publish to parents (signed)" : "Publier aux parents (signé)")}
    </button>
  );
}
