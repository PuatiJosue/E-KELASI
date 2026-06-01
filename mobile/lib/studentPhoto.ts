// Upload de la photo d'un enfant par le parent.
// Côté sécurité :
//   - Le bucket student-avatars est privé, INSERT/UPDATE/DELETE filtrés par
//     RLS sur parent_links (vérifié dans la policy storage).
//   - L'écriture de students.avatar_url passe par la RPC set_student_avatar
//     (SECURITY DEFINER) qui re-vérifie le lien parent → enfant.

import * as ImagePicker from "expo-image-picker";
import { supabase, isLiveMode } from "./supabase";

export async function pickAndUploadChildPhoto(studentId: string): Promise<
  | { ok: true; url: string }
  | { ok: false; error: string }
> {
  if (!isLiveMode || !supabase) {
    return { ok: false, error: "Mode démo : connexion à la base requise." };
  }

  // 1. Permission galerie
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { ok: false, error: "Accès à la galerie refusé." };

  // 2. Sélection
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
    base64: false,
  });
  if (picked.canceled || !picked.assets?.[0]) return { ok: false, error: "Annulé." };
  const asset = picked.assets[0];

  // 3. Lecture du fichier → ArrayBuffer
  const res = await fetch(asset.uri);
  const buf = await res.arrayBuffer();

  // 4. Détection du MIME (jpeg par défaut)
  const ext = (asset.mimeType ?? "image/jpeg").split("/")[1] === "png" ? "png"
            : (asset.mimeType ?? "").includes("webp") ? "webp" : "jpg";
  const contentType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const path = `${studentId}/photo.${ext}`;

  // 5. Upload (RLS storage vérifie que je suis bien parent de cet élève)
  const { error: upErr } = await supabase.storage
    .from("student-avatars")
    .upload(path, buf, { contentType, upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  // 6. URL publique signée 1 an (le bucket est privé mais lisible par tous
  //    les utilisateurs connectés via signed URL).
  const { data: signed, error: sErr } = await supabase.storage
    .from("student-avatars")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (sErr || !signed?.signedUrl) return { ok: false, error: sErr?.message ?? "URL signée impossible" };

  // 7. Écrit l'URL dans students via la RPC (qui re-vérifie le lien parent).
  const { error: rErr } = await supabase.rpc("set_student_avatar", {
    p_student_id: studentId,
    p_avatar_url: signed.signedUrl,
  });
  if (rErr) return { ok: false, error: rErr.message };

  return { ok: true, url: signed.signedUrl };
}
