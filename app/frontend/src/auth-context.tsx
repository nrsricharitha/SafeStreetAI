"import React, { createContext, useCallback, useContext, useEffect, useState } from \"react\";
import { api, auth, User } from \"@/src/api\";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  googleSignIn: (sessionId: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const token = await auth.getToken();
      if (token) {
        const me = await api.get<User>(\"/auth/me\");
        setUser(me);
      }
    } catch {
      await auth.clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const signIn = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>(
      \"/auth/login\",
      { email, password },
      false
    );
    await auth.setToken(res.token);
    setUser(res.user);
  };

  const signUp = async (name: string, email: string, password: string, phone?: string) => {
    const res = await api.post<{ token: string; user: User }>(
      \"/auth/register\",
      { name, email, password, phone },
      false
    );
    await auth.setToken(res.token);
    setUser(res.user);
  };

  const googleSignIn = async (sessionId: string) => {
    const res = await api.post<{ token: string; user: User }>(
      \"/auth/google\",
      { session_id: sessionId },
      false
    );
    await auth.setToken(res.token);
    setUser(res.user);
  };

  const signOut = async () => {
    await auth.clearToken();
    setUser(null);
  };

  const refresh = async () => {
    const me = await api.get<User>(\"/auth/me\");
    setUser(me);
  };

  return (
    <Ctx.Provider value={{ user, loading, signIn, signUp, googleSignIn, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error(\"useAuth outside AuthProvider\");
  return c;
}
"
