// Upload de la photo de profil du parent.
//   - Bucket privé user-avatars (RLS : chacun n'écrit que son dossier user_id).
//   - avatar_url écrit dans profiles (policy profiles_self_update).

import * as ImagePicker from "expo-image-picker";
import { supabase, isLiveMode } from "./supabase";

export async function pickAndUploadParentPhoto(): Promise<
  | { ok: true; url: string }
  | { ok: false; error: string }
> {
  if (!isLiveMode || !supabase) {
    return { ok: false, error: "Mode démo : connexion à la base requise." };
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { ok: false, error: "Accès à la galerie refusé." };

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
    base64: false,
  });
  if (picked.canceled || !picked.assets?.[0]) return { ok: false, error: "Annulé." };
  const asset = picked.assets[0];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non connecté." };

  const res = await fetch(asset.uri);
  const buf = await res.arrayBuffer();

  const ext = (asset.mimeType ?? "image/jpeg").split("/")[1] === "png" ? "png"
            : (asset.mimeType ?? "").includes("webp") ? "webp" : "jpg";
  const contentType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("user-avatars")
    .upload(path, buf, { contentType, upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  const { data: signed, error: sErr } = await supabase.storage
    .from("user-avatars")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (sErr || !signed?.signedUrl) return { ok: false, error: sErr?.message ?? "URL signée impossible" };

  const { error: rErr } = await supabase
    .from("profiles")
    .update({ avatar_url: signed.signedUrl })
    .eq("id", user.id);
  if (rErr) return { ok: false, error: rErr.message };

  return { ok: true, url: signed.signedUrl };
}
