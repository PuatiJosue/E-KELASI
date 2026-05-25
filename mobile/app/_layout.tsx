import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import * as Notifications from "expo-notifications";

import { registerForPushNotifications } from "@/lib/push";
import {
  useFonts,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";

import { StripeProvider } from "@stripe/stripe-react-native";

import { AuthProvider, useAuth } from "@/lib/auth";
import { LangProvider } from "@/lib/i18n";
import { themes } from "@/lib/theme";

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(tabs)" || segments[0] === "thread" || segments[0] === "notifications";
    if (!session && inAuthGroup) {
      router.replace("/");
    } else if (session && (segments.length === 0 || segments[0] === undefined)) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  // Enregistrer le push token dès qu'on a une session
  useEffect(() => {
    if (!session) return;
    registerForPushNotifications().catch(() => {});
  }, [session]);

  // Tap sur une notification → ouvrir l'écran approprié
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.screen === "thread" && data?.id) {
        router.push(`/thread/${data.id}`);
      } else if (data?.screen === "grades") {
        router.push("/(tabs)/grades");
      } else if (data?.screen === "homework") {
        router.push("/(tabs)/homework");
      } else {
        router.push("/notifications");
      }
    });
    return () => sub.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;

  const [fontsLoaded] = useFonts({
    Bricolage_600SemiBold: BricolageGrotesque_600SemiBold,
    Bricolage_700Bold: BricolageGrotesque_700Bold,
    PlusJakarta_500Medium: PlusJakartaSans_500Medium,
    PlusJakarta_700Bold: PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.brand} />
      </View>
    );
  }

  const Wrapped = (
    <SafeAreaProvider>
      <LangProvider value="fr">
        <AuthProvider>
          <AuthGate />
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.bg },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="signup" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="subscribe" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="thread" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="notifications" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          </Stack>
        </AuthProvider>
      </LangProvider>
    </SafeAreaProvider>
  );

  // StripeProvider seulement si la clé est configurée — sinon on skip pour éviter
  // les warnings RN en mode démo.
  if (!STRIPE_PUBLISHABLE_KEY) return Wrapped;
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.ekelasi.parent">
      {Wrapped}
    </StripeProvider>
  );
}
