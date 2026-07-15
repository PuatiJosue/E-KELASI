// Menu « + » (Ajouter) — regroupe les actions d'inscription pour le parent.

import { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";

const ITEMS: { icon: string; fr: string; en: string; route: string }[] = [
  { icon: "user", fr: "Enregistrer mon enfant", en: "Register my child", route: "/account/register-child" },
  { icon: "school", fr: "Inscription à une nouvelle année scolaire", en: "New school-year admission", route: "/account/inscription" },
  { icon: "refresh", fr: "Réinscription à une nouvelle année scolaire", en: "New school-year re-enrollment", route: "/account/reenroll" },
];

export function AddMenu({ size = 36 }: { size?: number }) {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Voir notifications.tsx : une Modal n'hérite pas des insets, et Android
  // dessine sous la barre de navigation.
  const insets = useSafeAreaInsets();

  const go = (route: string) => {
    setOpen(false);
    router.push(route as any);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.brand, alignItems: "center", justifyContent: "center" }}
      >
        <Icon name="plus" size={Math.round(size * 0.5)} color="#fff" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: Math.max(34, insets.bottom + 16), gap: 8 }}>
            <View style={{ alignItems: "center", marginBottom: 6 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.border }} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: "700", color: t.ink, fontFamily: fonts.display, paddingHorizontal: 4, marginBottom: 4 }}>
              {tr({ fr: "Ajouter", en: "Add" })}
            </Text>
            {ITEMS.map((it) => (
              <Pressable
                key={it.route}
                onPress={() => go(it.route)}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, backgroundColor: t.surface2 }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={it.icon} size={18} color={t.brand} />
                </View>
                <Text style={{ flex: 1, fontSize: 14.5, fontWeight: "600", color: t.ink, fontFamily: fonts.bodyBold }}>
                  {tr({ fr: it.fr, en: it.en })}
                </Text>
                <Icon name="chevR" size={18} color={t.ink4} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
