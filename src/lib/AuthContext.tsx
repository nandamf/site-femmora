import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { authClient } from "@/api/authClient";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isSupabaseConfigured: boolean;
  isPasswordRecovery: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsLoadingAuth(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setIsLoadingAuth(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setIsPasswordRecovery(event === "PASSWORD_RECOVERY");
        setIsLoadingAuth(false);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    await authClient.logout();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isAuthenticated: Boolean(session),
      isLoadingAuth,
      isSupabaseConfigured,
      isPasswordRecovery,
      logout,
    }),
    [isLoadingAuth, isPasswordRecovery, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser utilizado dentro de AuthProvider.");
  return context;
}

export default AuthContext;
