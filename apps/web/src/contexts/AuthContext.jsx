
"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    try {
      const usuarioSalvo =
        localStorage.getItem("usuario") ||
        sessionStorage.getItem("usuario");

      if (usuarioSalvo) {
        setUsuario(JSON.parse(usuarioSalvo));
      }
    } catch {
      localStorage.removeItem("usuario");
      sessionStorage.removeItem("usuario");
    } finally {
      setCarregando(false);
    }
  }, []);

  async function login({ email, senha, lembrar } = {}) {
    if (!email || !senha) {
      throw new Error("Preencha o e-mail e a senha.");
    }

    const resposta = await fetch(`${API_URL}/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, senha }),
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(
        dados.erro || dados.mensagem || "E-mail ou senha inválidos."
      );
    }

    setUsuario(dados.usuario);

    localStorage.removeItem("usuario");
    sessionStorage.removeItem("usuario");

    if (lembrar) {
      localStorage.setItem("usuario", JSON.stringify(dados.usuario));
    } else {
      sessionStorage.setItem("usuario", JSON.stringify(dados.usuario));
    }

    return dados;
  }

  function logout() {
    setUsuario(null);
    localStorage.removeItem("usuario");
    sessionStorage.removeItem("usuario");
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout,
        estaLogado: !!usuario,
        carregando,
      }}
    >
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
