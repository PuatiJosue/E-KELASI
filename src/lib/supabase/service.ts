import { createClient as createServiceClient } from "@supabase/supabase-js";

// Client Supabase « service role » : contourne la RLS. À n'utiliser QUE côté
// serveur, et uniquement après avoir vérifié les droits de l'appelant
// (voir les gardes de `@/lib/auth/guards`).
//
// Volontairement non typé par `Database` : les appels existants s'appuient sur
// des tables et colonnes que le type généré ne couvre pas toutes.
export function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
