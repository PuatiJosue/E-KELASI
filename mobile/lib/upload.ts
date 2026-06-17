// Téléverse un fichier local (URI) vers un bucket public et renvoie l'URL publique.
import { supabase } from "./supabase";

export async function uploadFile(bucket: string, path: string, uri: string, contentType: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const res = await fetch(uri);
    const buf = await res.arrayBuffer();
    const { error } = await supabase.storage.from(bucket).upload(path, buf, { contentType, upsert: false });
    if (error) return null;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}
