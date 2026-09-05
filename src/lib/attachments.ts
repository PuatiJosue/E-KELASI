// Pièces jointes (fichier ou photo) attachées par le professeur à une note ou
// à un devoir. Ce module est SANS dépendance serveur : il est importé aussi
// bien par les formulaires client que par les server actions.
// L'envoi vers le bucket privé vit dans `@/lib/attachments-server`.

/** Fichier envoyé par le navigateur (base64 sans le préfixe `data:`). */
export type AttachmentInput = { name: string; type: string; dataBase64: string };

/** Pièce jointe stockée (URL signée) telle qu'enregistrée en base. */
export type Attachment = { url: string; name: string; type: string; isImage: boolean };

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 Mo (= limite du bucket teacher-files)
export const MAX_ATTACHMENTS = 5;

/** Types acceptés par le bucket `teacher-files`. */
export const ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp,image/*,application/pdf";
export const PHOTO_ACCEPT = "image/*";

export const isImageType = (type: string | null | undefined) => (type ?? "").startsWith("image/");

/** Lit un fichier en base64, sans le préfixe `data:…;base64,`. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Relit les pièces jointes stockées en base (jsonb) sans faire confiance au contenu. */
export function parseAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
    .filter((a) => typeof a.url === "string" && a.url.length > 0)
    .map((a) => ({
      url: String(a.url),
      name: typeof a.name === "string" && a.name ? a.name : "Pièce jointe",
      type: typeof a.type === "string" ? a.type : "",
      isImage: a.isImage === true || isImageType(typeof a.type === "string" ? a.type : ""),
    }));
}
