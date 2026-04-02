"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api-client";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  provider: any | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; name: string; role?: string; language_preference?: string }) => Promise<{ email_verification_required?: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.get<{ user: User; provider: any }>("/auth/me");
      setUser(data.user);
      setProvider(data.provider);
      setToken(storedToken);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      setProvider(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await api.post<{ user: User; provider: any; token: string }>("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    setProvider(data.provider);
    return data.user;
  };

  const register = async (regData: { email: string; password: string; name: string; role?: string; language_preference?: string }): Promise<{ email_verification_required?: boolean }> => {
    const data = await api.post<{ user?: User; token?: string; email_verification_required?: boolean }>("/auth/register", regData);
    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
    }
    if (data.user) {
      setUser(data.user);
    }
    return { email_verification_required: data.email_verification_required };
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setProvider(null);
  };

  return (
    <AuthContext.Provider value={{ user, provider, token, loading, isAuthenticated: !!user, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
