import type { CSSProperties } from "react";

const TINTS: Array<[string, string]> = [
  ["#E0701E", "#FDF3E7"],
  ["#1D6650", "#ECF6F1"],
  ["#3A6DBC", "#E8F0FB"],
  ["#9747BB", "#F3E8FA"],
  ["#C28728", "#FBF1D9"],
  ["#B8475B", "#FBE6EC"],
];

export function Avatar({
  name = "?",
  size = 36,
  url,
  style,
}: {
  name?: string;
  size?: number;
  url?: string | null;
  style?: CSSProperties;
}) {
  // Photo dispo → on l'affiche en cercle
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          background: "var(--surface-2)",
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  // Sinon : initiales colorées (fallback)
  const initials = String(name)
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const code = [...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [fg, bg] = TINTS[code % TINTS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
