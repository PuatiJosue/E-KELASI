import { View, Text } from "react-native";
import Svg, { Rect, Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme, fonts } from "@/lib/theme";

export function Logo({ size = 28, withWord = false }: { size?: number; withWord?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Defs>
          <LinearGradient id="ekLogo" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#5468F0" />
            <Stop offset="1" stopColor="#8B5CF6" />
          </LinearGradient>
        </Defs>
        <Rect width={32} height={32} rx={9} fill="url(#ekLogo)" />
        <Path
          d="M10 8v16M10 16l7-8M10 16l8 8"
          stroke="#fff"
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
          E-KLASS
        </Text>
      )}
    </View>
  );
}
