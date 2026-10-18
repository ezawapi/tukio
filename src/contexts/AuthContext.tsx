import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep the same `user` object when nothing meaningful changed. Supabase
    // re-emits the session on token refresh and when the tab regains focus;
    // a new object identity there re-ran page effects and wiped open forms.
    const applyUser = (next: User | null) =>
      setUser((prev) => {
        if (prev && next && prev.id === next.id && JSON.stringify(prev) === JSON.stringify(next)) return prev;
        return next;
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        applyUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Read the locally stored session (no network round-trip, short lock).
    // A network getUser() here held the auth lock for seconds on slow mobile
    // connections, making every other request fail ("Lock broken").
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        applyUser(session?.user ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
