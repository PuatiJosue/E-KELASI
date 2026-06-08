"use client";

import { useState } from "react";
import { T } from "@/lib/i18n";

export function PayButton() {
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/school-checkout", { method: "POST" });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Le paiement par carte n'est pas disponible pour le moment.");
        setLoading(false);
      }
    } catch {
      alert("Erreur réseau. Réessaie.");
      setLoading(false);
    }
  };

  return (
    <button onClick={pay} disabled={loading} className="ek-btn ek-btn-primary" style={{ height: 40, fontSize: 13 }}>
      {loading ? "…" : <T fr="Payer 90 $/mois par carte" en="Pay $90/mo by card" />}
    </button>
  );
}
