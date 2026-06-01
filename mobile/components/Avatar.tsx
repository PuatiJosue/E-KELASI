import { View, Text, Image, type ViewStyle } from "react-native";
import { fonts } from "@/lib/theme";

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
  style?: ViewStyle;
}) {
  // Si on a une URL photo → on l'affiche en cercle
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: "#ECE3D2" },
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
