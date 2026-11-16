"use client";

import { useEffect, useState } from "react";
import { Star, Send, CheckCircle2, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function FeedbackForm({ aoSalvar, iniciarEditando = false }) {
  const { accessToken, carregando, renovarSessao, logout } = useAuth();

  const [satisfacaoGeral, setSatisfacaoGeral] = useState(null);
  const [navegacao, setNavegacao] = useState(null);
  const [ajudaViagem, setAjudaViagem] = useState("");
  const [avaliacaoProjeto, setAvaliacaoProjeto] = useState(null);
  const [sugestoes, setSugestoes] = useState("");

  const [verificando, setVerificando] = useState(true);
  const [jaAvaliou, setJaAvaliou] = useState(false);
  const [editando, setEditando] = useState(iniciarEditando);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  // Faz requisição autenticada renovando o token automaticamente se der 401
  async function fetchAutenticado(url, opcoes = {}) {
    let tokenAtual =
      accessToken ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");

    let resposta = await fetch(url, {
      ...opcoes,
      headers: {
        ...opcoes.headers,
        Authorization: `Bearer ${tokenAtual}`,
      },
    });

    if (resposta.status === 401 && renovarSessao) {
      const novoToken = await renovarSessao();
      if (novoToken) {
        resposta = await fetch(url, {
          ...opcoes,
          headers: {
            ...opcoes.headers,
            Authorization: `Bearer ${novoToken}`,
          },
        });
      } else {
        await logout();
      }
    }

    return resposta;
  }

  useEffect(() => {
    if (carregando) return;

    if (!accessToken) {
      setVerificando(false);
      return;
    }

    let cancelado = false;

    async function verificarAvaliacao() {
      try {
        const resposta = await fetchAutenticado(`${API_URL}/v1/avaliacoes/minha`);
        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
          throw new Error(dados.erro || "Não foi possível verificar sua avaliação.");
        }

        if (!cancelado) {
          const avaliacaoExistente = dados.avaliacao;
          setJaAvaliou(Boolean(dados.jaAvaliou || avaliacaoExistente));

          if (avaliacaoExistente) {
            setSatisfacaoGeral(avaliacaoExistente.satisfacaoGeral ?? null);
            setNavegacao(avaliacaoExistente.navegacao ?? null);
            setAjudaViagem(avaliacaoExistente.ajudaViagem ?? "");
            setAvaliacaoProjeto(avaliacaoExistente.avaliacaoProjeto ?? null);
            setSugestoes(avaliacaoExistente.sugestoes ?? "");
          }
        }
      } catch (error) {
        if (!cancelado) {
          setErro(error.message);
        }
      } finally {
        if (!cancelado) {
          setVerificando(false);
        }
      }
    }

    verificarAvaliacao();

    return () => {
      cancelado = true;
    };
  }, [accessToken, carregando]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (
      satisfacaoGeral === null ||
      navegacao === null ||
      avaliacaoProjeto === null
    ) {
      setErro("Preencha todas as notas antes de enviar.");
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetchAutenticado(`${API_URL}/v1/avaliacoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          satisfacaoGeral,
          navegacao,
          ajudaViagem,
          avaliacaoProjeto,
          sugestoes,
        }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        if (resposta.status === 409) {
          setJaAvaliou(true);
        }

        throw new Error(
          dados.erro || "Não foi possível enviar sua avaliação."
        );
      }

      setJaAvaliou(true);
      setEditando(false);
      if (aoSalvar) {
        await aoSalvar(dados.avaliacao);
      }
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  }

  function renderizarEstrelas(valor, alterarValor, prefixo) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((estrela) => (
          <button
            key={`${prefixo}-${estrela}`}
            type="button"
            onClick={() => alterarValor(estrela)}
            aria-label={`${estrela} de 5 estrelas`}
            aria-pressed={valor === estrela}
            className="cursor-pointer focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                (valor ?? 0) >= estrela
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-current opacity-30 hover:opacity-100"
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  if (carregando || verificando) {
    return (
      <div className="p-8 text-center bg-superficie rounded-2xl">
        Verificando sua avaliação...
      </div>
    );
  }

  if (jaAvaliou && !editando) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-superficie rounded-2xl border-2 border-current/10 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold">
          Você já enviou sua avaliação!
        </h3>
        <p className="opacity-70 mt-2">
          Muito obrigado por ajudar a melhorar o BuscaBus.
        </p>
        <button
          type="button"
          onClick={() => {
            setErro("");
            setEditando(true);
          }}
          className="mt-5 cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-current/20 hover:bg-superficie-alt text-sm font-bold transition"
        >
          <Pencil className="w-4 h-4" />
          Editar minha avaliação
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-superficie p-6 sm:p-8 rounded-2xl border-2 border-current/10 shadow-sm"
    >
      <div className="space-y-3">
        <label className="block text-base font-bold">
          1. Como você avalia sua satisfação geral com o BuscaBus?
        </label>
        {renderizarEstrelas(
          satisfacaoGeral,
          setSatisfacaoGeral,
          "satisfacao"
        )}
      </div>

      <div className="space-y-3">
        <label className="block text-base font-bold">
          2. Como você avalia a facilidade de navegação do sistema?
        </label>
        {renderizarEstrelas(navegacao, setNavegacao, "nav")}
      </div>

      <div className="space-y-3">
        <label htmlFor="ajudaViagem" className="block text-base font-bold">
          3. O BuscaBus te ajudou em alguma viagem específica? Conte-nos como foi.
        </label>
        <textarea
          id="ajudaViagem"
          rows={3}
          maxLength={1000}
          value={ajudaViagem}
          onChange={(e) => setAjudaViagem(e.target.value)}
          placeholder="Ex: Consegui não perder o ônibus na chuva..."
          className="w-full p-3 bg-transparent border-2 border-current/20 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-y"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-base font-bold">
          4. Como você avalia o projeto BuscaBus de forma geral?
        </label>
        {renderizarEstrelas(
          avaliacaoProjeto,
          setAvaliacaoProjeto,
          "projeto"
        )}
      </div>

      <div className="space-y-3">
        <label htmlFor="sugestoes" className="block text-base font-bold">
          5. Tem alguma sugestão ou opinião para melhorar a plataforma?
        </label>
        <textarea
          id="sugestoes"
          rows={3}
          maxLength={1000}
          value={sugestoes}
          onChange={(e) => setSugestoes(e.target.value)}
          placeholder="Deixe aqui suas ideias..."
          className="w-full p-3 bg-transparent border-2 border-current/20 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-y"
        />
      </div>

      {erro && (
        <p className="text-red-500 text-sm" role="alert">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={
            enviando ||
            satisfacaoGeral === null ||
            navegacao === null ||
            avaliacaoProjeto === null
          }
          className="cursor-pointer w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {enviando
            ? "Salvando..."
            : jaAvaliou
            ? "Salvar Alterações"
            : "Enviar Avaliação"}
        </button>

        {editando && (
          <button
            type="button"
            onClick={() => {
              setErro("");
              setEditando(false);
            }}
            className="cursor-pointer w-full sm:w-auto px-6 py-3 border-2 border-current/20 hover:bg-superficie-alt font-bold rounded-xl transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}