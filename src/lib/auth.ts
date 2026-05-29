import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

export type AuthContextValue = {
  isSupabaseConfigured: boolean;
  session: Session | null;
};

export const AuthContext = createContext<AuthContextValue>({
  isSupabaseConfigured: false,
  session: null,
});

export function useAuth() {
  return useContext(AuthContext);
}
