
"use client";

import { useEffect, useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function FeedbackForm() {
  const { accessToken } = useAuth();

  const [satisfacaoGeral, setSatisfacaoGeral] = useState(null);
  const [navegacao, setNavegacao] = useState(null);
  const [ajudaViagem, setAjudaViagem] = useState("");
  const [avaliacaoProjeto, setAvaliacaoProjeto] = useState(null);
  const [sugestoes, setSugestoes] = useState("");

  const [verificando, setVerificando] = useState(true);
  const [jaAvaliou, setJaAvaliou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    let cancelado = false;

    async function verificarAvaliacao() {
      try {
        const resposta = await fetch(`${API_URL}/v1/avaliacoes/minha`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
          throw new Error(dados.erro || "Não foi possível verificar sua avaliação.");
        }

        if (!cancelado) {
          setJaAvaliou(dados.jaAvaliou);
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
  }, [accessToken]);

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
      const resposta = await fetch(`${API_URL}/v1/avaliacoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
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
            className="focus:outline-none transition-transform hover:scale-110"
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

  if (verificando) {
    return (
      <div className="p-8 text-center bg-superficie rounded-2xl">
        Verificando sua avaliação...
      </div>
    );
  }

  if (jaAvaliou) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-superficie rounded-2xl border-2 border-current/10 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold">
          Você já enviou sua avaliação!
        </h3>
        <p className="opacity-70 mt-2">
          Muito obrigado por ajudar a melhorar o BuscaBus.
        </p>
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

      <button
        type="submit"
        disabled={
          enviando ||
          satisfacaoGeral === null ||
          navegacao === null ||
          avaliacaoProjeto === null
        }
        className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        {enviando ? "Enviando..." : "Enviar Avaliação"}
      </button>
    </form>
  );
}
