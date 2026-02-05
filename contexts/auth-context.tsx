"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getAuthToken, removeAuthToken } from "@/lib/cookies";

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: number;
  updatedAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verifyUser = useQuery(api.queries.verifyTokenQuery, token ? { token } : "skip");

  useEffect(() => {
    // Check for token in cookies on mount
    const storedToken = getAuthToken();
    if (storedToken) {
      setToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (verifyUser) {
      setUser(verifyUser);
      setIsLoading(false);
    } else if (token) {
      // Token was invalid, remove it
      removeAuthToken();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, [verifyUser, token]);

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}