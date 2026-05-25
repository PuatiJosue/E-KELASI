import { View, type ViewProps, type ViewStyle } from "react-native";
import { useTheme, radii } from "@/lib/theme";

export function Card({ style, children, ...rest }: ViewProps) {
  const t = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: t.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: t.border,
          shadowColor: "#140A06",
          shadowOpacity: 0.05,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Chip({
  label,
  tone = "neutral",
  icon,
  style,
}: {
  label: React.ReactNode;
  tone?: "neutral" | "brand" | "success" | "warn" | "danger" | "info";
  icon?: React.ReactNode;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const map = {
    neutral: { bg: t.surface2, fg: t.ink2 },
    brand:   { bg: t.brandSoft, fg: t.brand600 },
    success: { bg: t.accent100, fg: t.accent },
    warn:    { bg: "rgba(194,135,40,0.13)", fg: t.warning },
    danger:  { bg: "rgba(192,58,43,0.10)",  fg: t.danger },
    info:    { bg: "rgba(58,109,188,0.10)", fg: t.info },
  } as const;
  const c = map[tone];
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: c.bg,
        },
        style,
      ]}
    >
      {icon}
      {typeof label === "string" ? (
        <View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Label color={c.fg}>{label}</Label>
          </View>
        </View>
      ) : (
        label
      )}
    </View>
  );
}

import { Text } from "react-native";
import { fonts } from "@/lib/theme";

function Label({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <Text style={{ color, fontSize: 12, fontWeight: "600", fontFamily: fonts.bodyBold }}>{children}</Text>
  );
}
