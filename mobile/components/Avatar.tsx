import { View, Text, Image, type ViewStyle } from "react-native";
import { fonts } from "@/lib/theme";

const TINTS: Array<[string, string]> = [
  ["#4F66E8", "#E5EAFD"], // bleu
  ["#8B5CF6", "#EDE4FD"], // violet
  ["#16A34A", "#DCF4E5"], // vert
  ["#D97706", "#FCEEDA"], // ambre
  ["#E11D48", "#FCE2E8"], // rose
  ["#0EA5E9", "#E0F2FE"], // ciel
  ["#14B8A6", "#D6F3EF"], // sarcelle
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
  style?: ViewStyle;
}) {
  // Si on a une URL photo → on l'affiche en cercle
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: "#E7EAF3" },
          style as any,
        ]}
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
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={{ color: fg, fontSize: size * 0.4, fontWeight: "700", fontFamily: fonts.displayMedium }}>
        {initials}
      </Text>
    </View>
  );
}
