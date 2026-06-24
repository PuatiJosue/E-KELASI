// Push notification setup.
// Demande permission, récupère le token Expo, l'enregistre côté Supabase.
// À appeler une fois quand l'utilisateur est connecté.

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase, isLiveMode } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E0701E",
      sound: "default",
    });
    // Canal dédié aux notes : sonnerie + vibration (comme annonces/bulletins).
    await Notifications.setNotificationChannelAsync("grades", {
      name: "Notes",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1D6650",
      sound: "default",
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") {
    console.log("Push permission denied");
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoToken = tokenData.data;

    // Enregistre côté Supabase si on est en mode live
    if (isLiveMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("push_tokens").upsert(
          {
            user_id: user.id,
            expo_token: expoToken,
            platform: Platform.OS as "ios" | "android",
            device_name: Device.modelName ?? null,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "expo_token" }
        );
      }
    }

    return expoToken;
  } catch (e) {
    console.warn("Failed to get push token:", e);
    return null;
  }
}
