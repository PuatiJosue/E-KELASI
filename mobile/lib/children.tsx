// Contexte multi-enfants — charge tous les enfants actifs du parent connecté
// et garde l'enfant actuellement sélectionné. Les écrans Accueil / Notes /
// Devoirs suivent l'enfant sélectionné.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { listChildren, type Child } from "./db";
import { useAuth } from "./auth";

type ChildrenCtx = {
  children: Child[];
  selectedId: string | null;
  selectedChild: Child | null;
  loading: boolean;
  selectChild: (id: string) => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<ChildrenCtx | null>(null);

export function ChildrenProvider({ children: node }: { children: ReactNode }) {
  const { session } = useAuth();
  const [list, setList] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const kids = await listChildren();
      setList(kids);
      // Garde la sélection si elle existe toujours, sinon prend le premier.
      setSelectedId((prev) => {
        if (prev && kids.some((k) => k.id === prev)) return prev;
        return kids[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // (Re)charge la liste quand la session change (connexion / déconnexion).
  useEffect(() => {
    if (!session) {
      setList([]);
      setSelectedId(null);
      setLoading(false);
      return;
    }
    refresh();
  }, [session?.userId, refresh]);

  const selectedChild = list.find((c) => c.id === selectedId) ?? list[0] ?? null;

  return (
    <Ctx.Provider
      value={{ children: list, selectedId, selectedChild, loading, selectChild: setSelectedId, refresh }}
    >
      {node}
    </Ctx.Provider>
  );
}

export function useChildren() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChildren must be used within ChildrenProvider");
  return ctx;
}
