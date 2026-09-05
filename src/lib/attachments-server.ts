// Envoi des pièces jointes du professeur dans le bucket PRIVÉ `teacher-files`,
// puis génération d'URLs signées (1 an) — même schéma que les bulletins PDF et
// les pièces jointes d'annonce. Les parents ouvrent le fichier depuis leur
// notification, sans accès direct au bucket.

import { serviceClient } from "@/lib/supabase/service";
import { MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS, isImageType, type Attachment, type AttachmentInput } from "@/lib/attachments";

const BUCKET = "teacher-files";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 an

/**
 * Envoie les pièces jointes et retourne leurs URLs signées.
 * `error` est renseigné quand rien n'a pu être envoyé (taille, storage KO) :
 * l'appelant décide alors d'échouer ou de continuer sans pièce jointe.
 */
export async function uploadAttachments(
  prefix: string,
  inputs: AttachmentInput[] | undefined
): Promise<{ files: Attachment[]; error?: string }> {
  const list = (inputs ?? []).filter((f) => f?.dataBase64);
  if (list.length === 0) return { files: [] };
  if (list.length > MAX_ATTACHMENTS) return { files: [], error: `Maximum ${MAX_ATTACHMENTS} pièces jointes.` };

  const svc = serviceClient();
  const files: Attachment[] = [];
  let lastError: string | undefined;

  for (const [i, f] of list.entries()) {
    try {
      const bytes = Buffer.from(f.dataBase64, "base64");
      if (bytes.byteLength > MAX_ATTACHMENT_BYTES) {
        lastError = `« ${f.name} » dépasse 10 Mo.`;
        continue;
      }
      const safeName = (f.name || "fichier").replace(/[^\w.\-]/g, "_").slice(-80);
      const path = `${prefix}/${Date.now()}-${i}-${safeName}`;
      const { error: upErr } = await svc.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: f.type || "application/octet-stream", upsert: true });
      if (upErr) {
        lastError = `Envoi de « ${f.name} » impossible.`;
        continue;
      }
      const { data: signed } = await svc.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
      if (!signed?.signedUrl) {
        lastError = `Lien de « ${f.name} » indisponible.`;
        continue;
      }
      files.push({ url: signed.signedUrl, name: f.name || safeName, type: f.type || "", isImage: isImageType(f.type) });
    } catch {
      lastError = `Envoi de « ${f.name} » impossible.`;
    }
  }

  return files.length > 0 ? { files } : { files: [], error: lastError };
}
