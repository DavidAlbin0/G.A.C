"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_ROUTES } from "../utils/apiRoutes";

interface User {
  id?: string;
  username: string;
  email: string;
  rfc?: string;
  roles: string[];
  empresaId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, rfc: string, empresaId: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Validate token on load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("auth_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(API_ROUTES.auth.me, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const hasValidRole = data.roles && data.roles.some((r: string) => ["ADMIN", "USER_REMB", "USER_SUP_LEC"].includes(r));
          if (hasValidRole) {
            setUser({
              id: data.id,
              username: data.username,
              email: data.email,
              rfc: data.rfc,
              roles: data.roles,
              empresaId: data.empresaId,
            });
            setToken(storedToken);
          } else {
            localStorage.removeItem("auth_token");
            setUser(null);
            setToken(null);
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem("auth_token");
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error("Error validando la sesión inicial:", error);
        localStorage.removeItem("auth_token");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.auth.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Usuario o contraseña incorrectos");
      }

      const data = await response.json();
      const hasValidRole = data.roles && data.roles.some((r: string) => ["ADMIN", "USER_REMB", "USER_SUP_LEC"].includes(r));
      if (hasValidRole) {
        localStorage.setItem("auth_token", data.token);
        setToken(data.token);
        setUser({
          id: data.id,
          username: data.username,
          email: data.email,
          rfc: data.rfc,
          roles: data.roles,
          empresaId: data.empresaId,
        });
      } else {
        throw new Error("Usuario no autorizado para ingresar al sistema.");
      }
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, rfc: string, empresaId: string, role: string) => {
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.auth.register, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, rfc, empresaId, role }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Error al crear la cuenta");
      }

      // Auto login after successful registration
      await login(username, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
};
