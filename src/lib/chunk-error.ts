/**
 * Détecte les erreurs de chargement de chunk JS. Elles surviennent quand le
 * navigateur a en cache un vieux HTML qui référence des fichiers JS d'un build
 * précédent, supprimés par un nouveau déploiement (Vercel). Symptôme typique :
 * « Application error: a client-side exception has occurred » sur n'importe
 * quelle page, y compris des pages triviales comme /login.
 *
 * La solution : recharger une seule fois la page pour récupérer le HTML à jour.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { name?: string; message?: string };
  const name = err.name ?? "";
  const message = err.message ?? "";
  return (
    name === "ChunkLoadError" ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /Loading CSS chunk/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /importing a module script failed/i.test(message)
  );
}

/**
 * Recharge la page une seule fois pour un ChunkLoadError. Un garde en
 * sessionStorage évite toute boucle de rechargement si le problème persiste.
 * Retourne true si un rechargement a été déclenché.
 */
export function recoverFromChunkError(error: unknown): boolean {
  if (typeof window === "undefined" || !isChunkLoadError(error)) return false;
  const KEY = "ek-chunk-reload";
  try {
    if (sessionStorage.getItem(KEY)) return false; // déjà tenté : on n'insiste pas
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // sessionStorage indisponible (mode privé strict) : on recharge quand même une fois
  }
  window.location.reload();
  return true;
}

/** À appeler après un rendu réussi pour réarmer le garde anti-boucle. */
export function clearChunkReloadGuard(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("ek-chunk-reload");
  } catch {
    /* ignore */
  }
}
