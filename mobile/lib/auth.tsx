// Auth context — exposes the current session + sign-in / sign-out.
// In demo mode (no Supabase env vars), keeps a fake "Fatou Diallo" session.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase, isLiveMode } from "./supabase";

type Session = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
} | null;

type AuthCtx = {
  session: Session;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInDemo: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

const DEMO_SESSION: Session = {
  userId: "demo-user",
  email: "fatou.diallo@exemple.com",
  fullName: "Fatou Diallo",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  // Charge la photo de profil (profiles.avatar_url) et la fusionne dans la session.
  const hydrateAvatar = async (userId: string) => {
    if (!isLiveMode || !supabase) return;
    try {
      const { data } = await supabase.from("profiles").select("avatar_url").eq("id", userId).maybeSingle();
      const url = (data as any)?.avatar_url ?? null;
      setSession((prev) => (prev && prev.userId === userId ? { ...prev, avatarUrl: url } : prev));
    } catch {
      // avatar best effort
    }
  };

  useEffect(() => {
    if (!isLiveMode || !supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession({
          userId: data.session.user.id,
          email: data.session.user.email ?? "",
          fullName:
            (data.session.user.user_metadata?.full_name as string | undefined) ??
            data.session.user.email?.split("@")[0] ??
            "",
        });
        hydrateAvatar(data.session.user.id);
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) {
        setSession({
          userId: s.user.id,
          email: s.user.email ?? "",
          fullName: (s.user.user_metadata?.full_name as string | undefined) ?? s.user.email ?? "",
        });
        hydrateAvatar(s.user.id);
      } else {
        setSession(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    if (!isLiveMode || !supabase) {
      setSession(DEMO_SESSION);
      return { ok: true };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const signOut = async () => {
    if (isLiveMode && supabase) await supabase.auth.signOut();
    setSession(null);
  };

  const signInDemo = () => setSession(DEMO_SESSION);

  const refreshProfile = async () => {
    if (session?.userId) await hydrateAvatar(session.userId);
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut, signInDemo, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
