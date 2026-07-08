// Petite pastille M / F affichée à côté du nom d'un élève, partout dans l'app.
// M = bleu, F = rose. Rien si le sexe est inconnu.

export function SexBadge({ sex, size = 17 }: { sex: string | null | undefined; size?: number }) {
  if (sex !== "M" && sex !== "F") return null;
  const isM = sex === "M";
  return (
    <span
      title={isM ? "Masculin" : "Féminin"}
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.59),
        fontWeight: 700,
        color: "#fff",
        background: isM ? "#2563EB" : "#DB2777",
        lineHeight: 1,
      }}
    >
      {isM ? "M" : "F"}
    </span>
  );
}
