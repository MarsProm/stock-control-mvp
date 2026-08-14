import type { Session } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

export type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  authenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider no esta disponible");
  return value;
}
