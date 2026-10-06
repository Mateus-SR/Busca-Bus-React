"use client";

import { createContext, useContext, useState } from "react";
import { USUARIO_MOCK } from "@/lib/fixtures/usuarioFixture";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    if (typeof window === "undefined") return null;
    const salvo = localStorage.getItem("usuarioMock");
    if (!salvo) return null;
    try {
      return JSON.parse(salvo);
    } catch (e) {
      console.error("Erro ao carregar usuário salvo", e);
      localStorage.removeItem("usuarioMock");
      return null;
    }
  });

  const [carregando] = useState(false);

  function login() {
    setUsuario(USUARIO_MOCK);
    localStorage.setItem("usuarioMock", JSON.stringify(USUARIO_MOCK));
  }

  function logout() {
    setUsuario(null);
    localStorage.removeItem("usuarioMock");
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, estaLogado: !!usuario, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return contexto;
}