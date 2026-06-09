import { View, Text } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import { useTheme, fonts } from "@/lib/theme";

export function Logo({ size = 28, withWord = false }: { size?: number; withWord?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Rect width={32} height={32} rx={9} fill={t.brand} />
        <Path
          d="M10 8v16M10 16l7-8M10 16l8 8"
          stroke={t.gold}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
      {withWord && (
        <Text
          style={{
            fontSize: size * 0.7,
            fontFamily: fonts.displayMedium,
            color: t.ink,
            letterSpacing: -0.5,
            fontWeight: "700",
          }}
        >
          E-KELASI
        </Text>
      )}
    </View>
  );
}
