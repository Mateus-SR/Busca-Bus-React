
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import { aguardarDisponibilidadeApi, ehFalhaTransitoriaApi, ehStatusTransitorioApi } from "@busca-bus/core";

const AuthContext = createContext(null);

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function AuthProvider({ children }) {
  const { startLoading, stopLoading } = useLoading();
  const [usuario, setUsuario] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarSessao() {
      const tokenCarregamento = startLoading(
        "Verificando sessão...",
        "Por favor, aguarde."
      );

      try {
        const usuarioSalvo =
          localStorage.getItem("usuario") ||
          sessionStorage.getItem("usuario");

        const tokenSalvo =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");

        if (usuarioSalvo && tokenSalvo) {
          const usuarioInicial = JSON.parse(usuarioSalvo);

          setUsuario(usuarioInicial);
          setAccessToken(tokenSalvo);

          await verificarSessao(tokenSalvo);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setCarregando(false);
        stopLoading(tokenCarregamento);
      }
    }

    carregarSessao();
  }, [startLoading, stopLoading]);

  async function login({ email, senha, lembrar } = {}) {
    if (!email || !senha) {
      throw new Error("Preencha o e-mail e a senha.");
    }

    const opcoes = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    };
    let resposta;
    try {
      resposta = await fetch(`${API_URL}/v1/auth/login`, opcoes);
    } catch (erroRede) {
      if (!ehFalhaTransitoriaApi({ ...erroRede, codigo: "REDE" })) throw erroRede;
      const tokenInicializacao = startLoading(
        "Os serviços estão sendo iniciados.",
        "Isso pode levar até 1 minuto.\nAguarde enquanto tentamos novamente.",
      );
      try {
        await aguardarDisponibilidadeApi(API_URL);
        resposta = await fetch(`${API_URL}/v1/auth/login`, opcoes);
      } finally {
        stopLoading(tokenInicializacao);
      }
    }

    if (ehStatusTransitorioApi(resposta.status)) {
      let healthDisponivel = false;
      try {
        const health = await fetch(`${API_URL}/v1/health`);
        healthDisponivel = health.ok;
      } catch {
        healthDisponivel = false;
      }
      if (!healthDisponivel) {
        const tokenInicializacao = startLoading(
          "Os serviços estão sendo iniciados.",
          "Isso pode levar até 1 minuto.\nAguarde enquanto tentamos novamente.",
        );
        try {
          await aguardarDisponibilidadeApi(API_URL);
          resposta = await fetch(`${API_URL}/v1/auth/login`, opcoes);
        } finally {
          stopLoading(tokenInicializacao);
        }
      }
    }
    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(
        dados.erro || dados.mensagem || "E-mail ou senha inválidos."
      );
    }

    setUsuario(dados.usuario);

    localStorage.removeItem("usuario");
    sessionStorage.removeItem("usuario");
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");

    if (lembrar) {
      localStorage.setItem("usuario", JSON.stringify(dados.usuario));
      localStorage.setItem("accessToken", dados.accessToken);
    } else {
      sessionStorage.setItem("usuario", JSON.stringify(dados.usuario));
      sessionStorage.setItem("accessToken", dados.accessToken);
    }

    setAccessToken(dados.accessToken);
    return dados;
  }

  function logout() {
    setUsuario(null);
    setAccessToken(null);
    localStorage.removeItem("usuario");
    sessionStorage.removeItem("usuario");
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
  }


  async function verificarSessao(token = accessToken) {
    if (!token) return false;

    try {
      const resposta = await fetch(`${API_URL}/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resposta.status === 401) {
        logout();
        return false;
      }

      return resposta.ok;
    } catch {
      return false;
    }
  }

  async function atualizarAvatar(avatarId) {
    if (!accessToken) throw new Error("Sua sessão expirou. Entre novamente.");

    const resposta = await fetch(`${API_URL}/v1/me/avatar`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ avatarId }),
    });
    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível salvar o avatar.");
    }

    setUsuario(dados.usuario);
    const armazenamento = localStorage.getItem("accessToken")
      ? localStorage
      : sessionStorage;
    armazenamento.setItem("usuario", JSON.stringify(dados.usuario));
    return dados.usuario;
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        accessToken,
        login,
        logout,
        atualizarAvatar,
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
