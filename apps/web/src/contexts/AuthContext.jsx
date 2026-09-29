"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { USUARIO_MOCK } from "@/lib/fixtures/usuarioFixture";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const salvo = localStorage.getItem("usuarioMock");
    if (salvo) {
      const usuarioSalvo = JSON.parse(salvo);
      setTimeout(() => setUsuario(usuarioSalvo), 0);
    }
  }, []);

  function login() {
    setUsuario(USUARIO_MOCK);
    localStorage.setItem("usuarioMock", JSON.stringify(USUARIO_MOCK));
  }

  function logout() {
    setUsuario(null);
    localStorage.removeItem("usuarioMock");
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, estaLogado: !!usuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return contexto;
}
