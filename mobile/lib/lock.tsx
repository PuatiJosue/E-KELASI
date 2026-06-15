// Verrou du dossier — code à 4 chiffres stocké sur l'appareil (expo-secure-store).
//
// Modèle : avant d'accéder aux dossiers des enfants, le parent doit saisir un
// code à 4 chiffres. Le code est défini une fois (à la première ouverture après
// connexion) puis redemandé à chaque ouverture de l'app (cold start) et au retour
// depuis l'arrière-plan. Purement local : aucune donnée envoyée au serveur.

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "./auth";

const PIN_KEY = "ekelasi.dossier.pin";

async function readPin(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PIN_KEY);
  } catch {
    return null;
  }
}

type LockCtx = {
  loading: boolean;
  hasPin: boolean; // un code est-il défini sur cet appareil ?
  locked: boolean; // l'app est-elle actuellement verrouillée ?
  setPin: (pin: string) => Promise<void>; // définir / changer le code
  unlock: (pin: string) => Promise<boolean>; // déverrouiller (retourne true si correct)
  lockNow: () => void; // reverrouiller manuellement
};

const Ctx = createContext<LockCtx | null>(null);

export function LockProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [locked, setLocked] = useState(true);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Au démarrage : verrouillé si un code existe, sinon il faudra en créer un.
  useEffect(() => {
    readPin().then((pin) => {
      setHasPin(!!pin);
      setLocked(!!pin); // s'il y a un code → verrouillé ; sinon → création requise
      setLoading(false);
    });
  }, []);

  // Ré-arme le verrou à chaque (re)connexion d'un compte.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (session && hasPin) setLocked(true);
  }, [session?.userId]);

  // Reverrouille au retour depuis l'arrière-plan.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const prev = appState.current;
      appState.current = next;
      if (next === "active" && (prev === "background" || prev === "inactive")) {
        if (hasPin) setLocked(true);
      }
    });
    return () => sub.remove();
  }, [hasPin]);

  const setPin: LockCtx["setPin"] = async (pin) => {
    await SecureStore.setItemAsync(PIN_KEY, pin);
    setHasPin(true);
    setLocked(false);
  };

  const unlock: LockCtx["unlock"] = async (pin) => {
    const stored = await readPin();
    if (stored && stored === pin) {
      setLocked(false);
      return true;
    }
    return false;
  };

  const lockNow = () => {
    if (hasPin) setLocked(true);
  };

  return (
    <Ctx.Provider value={{ loading, hasPin, locked, setPin, unlock, lockNow }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLock() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLock must be used within LockProvider");
  return ctx;
}
