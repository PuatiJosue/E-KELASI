import { Logo } from "@/components/Logo";

// En-tête officiel d'un document de l'école : logo + nom + ville de l'école
// à gauche, et titre/valeur du document à droite. Utilisé sur les bulletins,
// confirmations d'inscription/réinscription et reçus de paiement.
export function SchoolLetterhead({
  name,
  subtitle,
  logoUrl,
  rightTitle,
  rightValue,
}: {
  name?: string | null;
  subtitle?: string | null;
  logoUrl?: string | null;
  rightTitle?: string;
  rightValue?: string | null;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            style={{ width: 56, height: 56, borderRadius: 10, objectFit: "contain", background: "#fff", border: "1px solid #ECE3D2" }}
          />
        ) : (
          <Logo size={40} />
        )}
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", color: "#1a1410", lineHeight: 1.15 }}>
            {name || "—"}
          </div>
          {subtitle ? <div style={{ fontSize: 12, color: "#8a7c6e", marginTop: 2 }}>{subtitle}</div> : null}
        </div>
      </div>
      {rightTitle ? (
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#8a7c6e", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
            {rightTitle}
          </div>
          {rightValue ? (
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-display)", color: "#1a1410", marginTop: 2 }}>
              {rightValue}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
