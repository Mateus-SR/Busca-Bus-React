"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { USUARIO_MOCK } from "@/lib/fixtures/usuarioFixture";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const tarefa = window.setTimeout(() => {
      const salvo = localStorage.getItem("usuarioMock");
      if (!salvo) {
        setCarregando(false);
        return;
      }
      try {
        setUsuario(JSON.parse(salvo));
      } catch (e) {
        console.error("Erro ao carregar usuário salvo", e);
        localStorage.removeItem("usuarioMock");
      } finally {
        setCarregando(false);
      }
    }, 0);
    return () => window.clearTimeout(tarefa);
  }, []);

  function login({ email, senha, lembrar } = {}) {
    if (!email || !senha) return;
    setUsuario(USUARIO_MOCK);
    if (lembrar) {
      localStorage.setItem("usuarioMock", JSON.stringify(USUARIO_MOCK));
    }
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