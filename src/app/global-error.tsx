"use client";

import { useEffect } from "react";
import { recoverFromChunkError } from "@/lib/chunk-error";

/**
 * Error boundary racine : remplace le layout entier (donc doit fournir ses
 * propres <html>/<body> et des styles inline autonomes). Attrape les erreurs
 * qui surviennent dans le layout lui-même. Comme error.tsx, il récupère
 * automatiquement les ChunkLoadError après un déploiement.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (recoverFromChunkError(error)) return;
    console.error("[E-KLASS] Erreur globale non gérée:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: "#f5f6fb" }}>
          <div style={{ maxWidth: 440, background: "#fff", borderRadius: 20, padding: "36px 32px", boxShadow: "0 20px 50px -20px rgba(30,47,109,0.35)" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>😕</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1E2F6D", margin: "0 0 10px" }}>Une erreur est survenue</h1>
            <p style={{ fontSize: 14.5, color: "#5b5f78", lineHeight: 1.55, margin: "0 0 22px" }}>
              L&apos;application n&apos;a pas pu démarrer correctement. Rechargez la page.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => reset()} style={{ padding: "11px 20px", borderRadius: 11, border: "none", background: "#1E2F6D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Réessayer
              </button>
              <button onClick={() => window.location.reload()} style={{ padding: "11px 20px", borderRadius: 11, border: "1px solid #d5d8e8", background: "#fff", color: "#1E2F6D", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Recharger la page
              </button>
            </div>
            {error?.digest && <p style={{ marginTop: 18, fontSize: 11.5, color: "#a0a3b8" }}>Code : {error.digest}</p>}
          </div>
        </div>
      </body>
    </html>
  );
}
