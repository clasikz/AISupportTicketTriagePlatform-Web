"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AuthTokens } from "@/types";
import { endpoints } from "@/lib/endpoints";

interface AuthState {
  userId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (userId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const accessToken = localStorage.getItem("accessToken");
    setState({
      userId,
      accessToken,
      isAuthenticated: Boolean(userId && accessToken),
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (userId: string) => {
    const res = await fetch(endpoints.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      throw new Error("Login failed");
    }

    const tokens: AuthTokens = await res.json();
    localStorage.setItem("userId", userId);
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);

    setState({
      userId,
      accessToken: tokens.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("userId");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setState({
      userId: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
