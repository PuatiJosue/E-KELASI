"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { validateMobileMoneyAction, rejectMobileMoneyAction } from "@/app/(admin)/payments/actions";

export function MobileMoneyActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<"validate" | "reject" | null>(null);
  const [reason, setReason] = useState("");

  const validate = () => {
    startTransition(async () => {
      const res = await validateMobileMoneyAction(id);
      if (res.ok) router.refresh();
      else alert(res.message);
    });
  };

  const reject = () => {
    if (!reason.trim()) {
      alert("Indiquez une raison.");
      return;
    }
    startTransition(async () => {
      const res = await rejectMobileMoneyAction(id, reason.trim());
      if (res.ok) router.refresh();
      else alert(res.message);
    });
  };

  if (confirming === "reject") {
    return (
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Raison du rejet…"
          style={{
            flex: 1,
            padding: "6px 8px",
            fontSize: 11.5,
            borderRadius: 6,
            border: "1px solid var(--border-strong)",
            background: "var(--surface)",
            color: "var(--ink)",
            minWidth: 0,
          }}
        />
        <button
          onClick={reject}
          disabled={pending}
          style={{
            padding: "5px 8px",
            borderRadius: 6,
            background: "var(--danger)",
            color: "white",
            fontSize: 11,
            fontWeight: 600,
            opacity: pending ? 0.6 : 1,
          }}
        >
          OK
        </button>
        <button
          onClick={() => {
            setConfirming(null);
            setReason("");
          }}
          style={{ padding: 4, color: "var(--ink-3)" }}
        >
          <Icon name="close" size={14} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
      <button
        onClick={validate}
        disabled={pending}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          background: "var(--accent-100)",
          color: "var(--accent)",
          fontSize: 11.5,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          opacity: pending ? 0.6 : 1,
        }}
      >
        <Icon name="check" size={12} stroke={3} />
        <T fr="Valider" en="Validate" />
      </button>
      <button
        onClick={() => setConfirming("reject")}
        disabled={pending}
        style={{
          padding: "6px 8px",
          borderRadius: 6,
          background: "rgba(192,58,43,0.10)",
          color: "var(--danger)",
          fontSize: 11.5,
          fontWeight: 700,
        }}
      >
        <Icon name="close" size={12} stroke={3} />
      </button>
    </div>
  );
}
