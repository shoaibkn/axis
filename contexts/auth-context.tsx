"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getAuthToken, removeAuthToken, setAuthToken } from "@/lib/cookies";

type AuthUser = {
  _id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

type AuthTokenContextValue = {
  token: string | null;
  bootstrapped: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AuthTokenContext = createContext<AuthTokenContextValue | null>(null);

export function AuthTokenProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const existingToken = getAuthToken();
    setTokenState(existingToken);
    setBootstrapped(true);
  }, []);

  const setToken = useCallback((value: string) => {
    setAuthToken(value);
    setTokenState(value);
  }, []);

  const clearToken = useCallback(() => {
    removeAuthToken();
    setTokenState(null);
  }, []);

  const value = useMemo(
    () => ({ token, bootstrapped, setToken, clearToken }),
    [token, bootstrapped, setToken, clearToken],
  );

  return (
    <AuthTokenContext.Provider value={value}>
      {children}
    </AuthTokenContext.Provider>
  );
}

function useAuthTokenState() {
  const context = useContext(AuthTokenContext);
  if (!context) {
    throw new Error("useAuthTokenState must be used within AuthTokenProvider");
  }
  return context;
}

export function useAuthTokenForConvex() {
  const { token, bootstrapped } = useAuthTokenState();

  const fetchAccessToken = useCallback(
    async (_args?: { forceRefreshToken: boolean }) => {
      return token;
    },
    [token],
  );

  return {
    isLoading: !bootstrapped,
    isAuthenticated: Boolean(token),
    fetchAccessToken,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, setToken, clearToken, bootstrapped } = useAuthTokenState();
  const { isAuthenticated: convexAuthed, isLoading: convexLoading } =
    useConvexAuth();

  const loginAction = useAction(api.auth.login);
  const signupAction = useAction(api.auth.signup);

  const currentUser = useQuery(
    api.users.current,
    convexAuthed ? {} : "skip",
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginAction({ email, password });
      setToken(result.token);
    },
    [loginAction, setToken],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await signupAction({ name, email, password });
      setToken(result.token);
    },
    [signupAction, setToken],
  );

  const logout = useCallback(() => {
    clearToken();
  }, [clearToken]);

  useEffect(() => {
    if (bootstrapped && !convexLoading && !convexAuthed && token) {
      clearToken();
    }
  }, [bootstrapped, clearToken, convexAuthed, convexLoading, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: convexAuthed ? (currentUser ?? null) : null,
      isAuthenticated: convexAuthed,
      isLoading: !bootstrapped || convexLoading,
      login,
      signup,
      logout,
    }),
    [
      bootstrapped,
      convexAuthed,
      convexLoading,
      currentUser,
      login,
      signup,
      logout,
    ],
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
