// Résultat standard des server actions : succès nu, ou échec porteur d'un
// message déjà destiné à l'utilisateur final.
export type Result = { ok: true } | { ok: false; message: string };

// Variante dont le succès porte aussi un message (toasts de confirmation).
export type MessageResult = { ok: true; message: string } | { ok: false; message: string };
