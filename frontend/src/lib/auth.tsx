"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as api from "./api";
import type { LoginPayload, RegisterPayload, User } from "./types";

/** Shape of the authentication context exposed to the app. */
interface AuthContextValue {
  /** The signed-in user, or null when logged out. */
  user: User | null;
  /** True while the initial session restore (GET /auth/me) is in flight. */
  loading: boolean;
  /** Log in, persist the token, and return the authenticated user. */
  login: (payload: LoginPayload) => Promise<User>;
  /** Register, persist the token, and return the new user. */
  register: (payload: RegisterPayload) => Promise<User>;
  /** Clear the session locally. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provides authentication state to the tree. On mount it restores any stored
 * session by calling the backend's `/auth/me`, so a refresh keeps the user
 * signed in. All token handling is centralised in the api module.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore the session from a stored token on first load.
  useEffect(() => {
    let active = true;
    async function restore() {
      if (!api.getStoredToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.getMe();
        if (active) {
          setUser({
            id: me.sub,
            email: me.email,
            role: me.role,
            ethereumAddress: me.ethereumAddress,
          });
        }
      } catch {
        // Token invalid/expired — drop it.
        api.clearStoredToken();
      } finally {
        if (active) setLoading(false);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, []);

  /** Authenticate, store the token, and update local state. */
  const login = useCallback(async (payload: LoginPayload) => {
    const result = await api.login(payload);
    api.setStoredToken(result.accessToken);
    setUser(result.user);
    return result.user;
  }, []);

  /** Register, store the token, and update local state. */
  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await api.register(payload);
    api.setStoredToken(result.accessToken);
    setUser(result.user);
    return result.user;
  }, []);

  /** Clear the session. */
  const logout = useCallback(() => {
    api.clearStoredToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth context; throws if used outside the provider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
