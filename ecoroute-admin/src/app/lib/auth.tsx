import { createContext, useCallback, useContext, useState } from 'react';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

interface JwtPayload {
  email?: string;
  user_metadata?: { full_name?: string; name?: string };
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

interface AuthCtx {
  token: string | null;
  email: string | null;
  displayName: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  token: null,
  email: null,
  displayName: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('admin_token'),
  );

  const decoded = token ? decodeJwt(token) : null;
  const email = decoded?.email ?? null;
  const displayName = decoded?.user_metadata?.full_name ?? decoded?.user_metadata?.name ?? null;

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description ?? data.msg ?? 'Login failed');

    sessionStorage.setItem('admin_token', data.access_token as string);
    setToken(data.access_token as string);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('admin_token');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, email, displayName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
