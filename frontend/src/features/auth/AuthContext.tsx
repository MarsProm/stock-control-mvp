import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { setAccessToken } from "../../lib/api";
import {
  authFlowTypeFromUrl,
  openPasswordSetup,
  requiresPasswordSetup,
} from "./auth-flow";
import { localAuthMode, supabase } from "./supabase";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!localAuthMode);

  useEffect(() => {
    if (!supabase) return;
    const authFlowType = authFlowTypeFromUrl();
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAccessToken(data.session?.access_token ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setAccessToken(nextSession?.access_token ?? null);
      setLoading(false);
      if (nextSession && requiresPasswordSetup(event, authFlowType)) {
        openPasswordSetup();
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      authenticated: localAuthMode || Boolean(session),
      signIn: async (email, password) => {
        if (!supabase) return;
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        setAccessToken(null);
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
