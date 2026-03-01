import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { http, attachAccessToken } from "../lib/http";
import type { AuthSession, User } from "../types/api";

const TOKEN_KEY = "talentscope.access_token";
const USER_KEY = "talentscope.user";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  loading: boolean;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((session: AuthSession) => {
    const accessToken = session.token.access_token;
    setToken(accessToken);
    setUser(session.user);
    attachAccessToken(accessToken);
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    attachAccessToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const signup = useCallback(
    async (fullName: string, email: string, password: string) => {
      const response = await http.post<AuthSession>("/auth/signup", {
        full_name: fullName,
        email,
        password
      });
      persistSession(response.data);
    },
    [persistSession]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await http.post<AuthSession>("/auth/login", { email, password });
      persistSession(response.data);
    },
    [persistSession]
  );

  useEffect(() => {
    const existingToken = localStorage.getItem(TOKEN_KEY);
    const existingUser = localStorage.getItem(USER_KEY);

    async function hydrateSession() {
      if (!existingToken) {
        setLoading(false);
        return;
      }

      attachAccessToken(existingToken);
      setToken(existingToken);

      if (existingUser) {
        try {
          setUser(JSON.parse(existingUser));
        } catch {
          localStorage.removeItem(USER_KEY);
        }
      }

      try {
        const response = await http.get<User>("/auth/me");
        setUser(response.data);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }

    hydrateSession().catch(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    const interceptorId = http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      http.interceptors.response.eject(interceptorId);
    };
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, loading, signup, login, logout }),
    [token, user, loading, signup, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
