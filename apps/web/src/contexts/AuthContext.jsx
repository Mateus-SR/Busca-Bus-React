
"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const renovacaoEmAndamento = useRef(null);

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
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refreshToken");

    if (lembrar) {
      localStorage.setItem("usuario", JSON.stringify(dados.usuario));
      localStorage.setItem("accessToken", dados.accessToken);
      localStorage.setItem("refreshToken", dados.refreshToken);
    } else {
      sessionStorage.setItem("usuario", JSON.stringify(dados.usuario));
      sessionStorage.setItem("accessToken", dados.accessToken);
      sessionStorage.setItem("refreshToken", dados.refreshToken);
    }

    setAccessToken(dados.accessToken);
    return dados;
  }


  async function logout() {
    const refreshToken =
      localStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await fetch(`${API_URL}/v1/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
    } finally {
      setUsuario(null);
      setAccessToken(null);

      localStorage.removeItem("usuario");
      sessionStorage.removeItem("usuario");
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("refreshToken");
    }
  }

  async function renovarSessao() {
    if (renovacaoEmAndamento.current) {
      return renovacaoEmAndamento.current;
    }

    const tarefa = (async () => {
      const refreshToken =
        localStorage.getItem("refreshToken") ||
        sessionStorage.getItem("refreshToken");

      if (!refreshToken) return false;

      const armazenamento = localStorage.getItem("refreshToken")
        ? localStorage
        : sessionStorage;

      try {
        const resposta = await fetch(`${API_URL}/v1/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (resposta.status === 401) return false;
        if (!resposta.ok) return null;

        const dados = await resposta.json();

        if (!dados.accessToken || !dados.refreshToken || !dados.usuario) {
          return null;
        }

        armazenamento.setItem("usuario", JSON.stringify(dados.usuario));
        armazenamento.setItem("accessToken", dados.accessToken);
        armazenamento.setItem("refreshToken", dados.refreshToken);

        setUsuario(dados.usuario);
        setAccessToken(dados.accessToken);

        return dados.accessToken;
      } catch {
        return null;
      }
    })();

    renovacaoEmAndamento.current = tarefa;

    try {
      return await tarefa;
    } finally {
      renovacaoEmAndamento.current = null;
    }
  }

  useEffect(() => {
    if (!accessToken) return;

    let temporizador;
    let cancelado = false;

    async function executarRenovacao() {
      if (cancelado) return;

      const resultado = await renovarSessao();

      if (cancelado) return;

      if (resultado === false) {
        await logout();
        return;
      }

      if (resultado === null) {
        temporizador = setTimeout(executarRenovacao, 30000);
      }
    }

    try {
      const payload = JSON.parse(
        atob(
          accessToken
            .split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/")
        )
      );

      const tempoRestante = payload.exp * 1000 - Date.now();
      const antecedencia = 60000;

      temporizador = setTimeout(
        executarRenovacao,
        Math.max(0, tempoRestante - antecedencia)
      );
    } catch {
      temporizador = setTimeout(executarRenovacao, 0);
    }

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [accessToken]);


  async function verificarSessao(token = accessToken) {
    if (!token) return false;

    try {
      let resposta = await fetch(`${API_URL}/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resposta.status === 401) {
        const novoToken = await renovarSessao();

        if (!novoToken) {
          logout();
          return false;
        }

        resposta = await fetch(`${API_URL}/v1/me`, {
          headers: {
            Authorization: `Bearer ${novoToken}`,
          },
        });

        if (resposta.status === 401) {
          logout();
          return false;
        }
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

  async function atualizarInstituicao(fac_id) {
    if (!accessToken) throw new Error("Sua sessão expirou. Entre novamente.");

    const resposta = await fetch(`${API_URL}/v1/me/instituicao`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ fac_id }),
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível atualizar a instituição.");
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
        atualizarInstituicao,
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
