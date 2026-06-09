import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";

export function ScreenHeader({ title }: { title: string }) {
  const t = useTheme();
  const router = useRouter();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
      <Pressable
        onPress={() => router.back()}
        style={{ width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" }}
      >
        <Icon name="chevL" size={22} color={t.ink2} />
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: "700", color: t.ink, fontFamily: fonts.display }}>{title}</Text>
    </View>
  );
}
