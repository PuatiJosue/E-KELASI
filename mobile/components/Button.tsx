import { Pressable, Text, type PressableProps, type ViewStyle, type TextStyle } from "react-native";
import { useTheme, fonts } from "@/lib/theme";

type Variant = "primary" | "ghost" | "outline";

export function Button({
  variant = "primary",
  children,
  style,
  textStyle,
  ...rest
}: PressableProps & {
  variant?: Variant;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}) {
  const t = useTheme();
  const variants = {
    primary: { bg: t.brand,   fg: t.onBrand, border: "transparent" },
    ghost:   { bg: "transparent", fg: t.ink2, border: "transparent" },
    outline: { bg: t.surface, fg: t.ink,  border: t.borderStrong },
  } as const;
  const v = variants[variant];
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: 1,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {typeof children === "string" ? (
        <Text style={[{ color: v.fg, fontWeight: "600", fontFamily: fonts.bodyBold, fontSize: 14 }, textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
