"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import FeedbackForm from "@/components/FeedbackForm";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AvaliacoesPage() {
  const { usuario, accessToken } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [resumo, setResumo] = useState({
    total: 0,
    mediaSatisfacaoGeral: 0,
    mediaNavegacao: 0,
    mediaAvaliacaoProjeto: 0,
  });
  const [loading, setLoading] = useState(true);

  const carregarAvaliacoes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/v1/avaliacoes`);
      const data = await res.json();

      setAvaliacoes(data.avaliacoes || []);
      if (data.resumo) setResumo(data.resumo);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarAvaliacoes();
  }, [carregarAvaliacoes]);

  function renderEstrelas(nota) {
    const arredondado = Math.round(nota);
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={`${nota} de 5 estrelas`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i <= arredondado
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-current opacity-30"
            }`}
          />
        ))}
      </span>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-68px)] bg-superficie-alt text-texto py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-texto">
            Avaliações do BuscaBus
          </h1>
          <p className="text-texto-suave text-sm sm:text-base">
            Veja o que os usuários estão achando e deixe ou edite a sua avaliação.
          </p>
        </header>

        <section aria-label="Sua avaliação">
          {usuario && accessToken ? (
            <FeedbackForm aoSalvar={carregarAvaliacoes} />
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-superficie p-6 rounded-2xl border-2 border-current/10">
              <div>
                <h2 className="text-lg font-bold">Quer avaliar o BuscaBus?</h2>
                <p className="text-sm text-texto-suave mt-1">
                  Entre na sua conta para registrar ou editar sua avaliação.
                </p>
              </div>
              <Link
                href="/login"
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm text-center transition-colors"
              >
                Fazer login para avaliar
              </Link>
            </div>
          )}
        </section>

        <section aria-label="Resumo das avaliações" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-superficie border-2 border-current/10 p-5 rounded-2xl">
            <span className="text-xs text-texto-mudo uppercase tracking-wider font-bold">
              Total de Avaliações
            </span>
            <p className="text-3xl font-extrabold text-texto mt-2">
              {resumo.total}
            </p>
          </div>

          <div className="bg-superficie border-2 border-current/10 p-5 rounded-2xl">
            <span className="text-xs text-texto-mudo uppercase tracking-wider font-bold">
              Satisfação Geral
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl font-extrabold text-yellow-500">
                {resumo.mediaSatisfacaoGeral.toFixed(1)}
              </span>
              {renderEstrelas(resumo.mediaSatisfacaoGeral)}
            </div>
          </div>

          <div className="bg-superficie border-2 border-current/10 p-5 rounded-2xl">
            <span className="text-xs text-texto-mudo uppercase tracking-wider font-bold">
              Navegação
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl font-extrabold text-yellow-500">
                {resumo.mediaNavegacao.toFixed(1)}
              </span>
              {renderEstrelas(resumo.mediaNavegacao)}
            </div>
          </div>

          <div className="bg-superficie border-2 border-current/10 p-5 rounded-2xl">
            <span className="text-xs text-texto-mudo uppercase tracking-wider font-bold">
              Avaliação do Projeto
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl font-extrabold text-yellow-500">
                {resumo.mediaAvaliacaoProjeto.toFixed(1)}
              </span>
              {renderEstrelas(resumo.mediaAvaliacaoProjeto)}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-texto">
            Avaliações da Comunidade
          </h2>

          {loading ? (
            <p className="text-texto-suave text-sm">Carregando avaliações...</p>
          ) : avaliacoes.length === 0 ? (
            <div className="bg-superficie border-2 border-current/10 p-6 rounded-2xl text-texto-suave text-sm">
              Nenhuma avaliação cadastrada ainda. Seja o primeiro a avaliar!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {avaliacoes.map((item) => {
                const ehMinha =
                  usuario?.id && String(usuario.id) === String(item.usuarioId);

                return (
                  <article
                    key={item._id}
                    className={`bg-superficie border-2 p-5 rounded-2xl flex flex-col justify-between space-y-4 ${
                      ehMinha ? "border-red-500/60" : "border-current/10"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-texto text-sm">
                              {item.nomeUsuario}
                            </h3>
                            {ehMinha && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 font-bold">
                                Sua avaliação
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-texto-mudo">
                            {new Date(
                              item.updatedAt || item.createdAt
                            ).toLocaleDateString("pt-BR")}
                            {item.updatedAt && item.updatedAt !== item.createdAt
                              ? " (editado)"
                              : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-superficie-alt border border-borda text-texto-suave">
                          Geral:{" "}
                          <strong className="text-yellow-500">
                            {item.satisfacaoGeral}/5 ★
                          </strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-superficie-alt border border-borda text-texto-suave">
                          Navegação:{" "}
                          <strong className="text-yellow-500">
                            {item.navegacao}/5 ★
                          </strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-superficie-alt border border-borda text-texto-suave">
                          Projeto:{" "}
                          <strong className="text-yellow-500">
                            {item.avaliacaoProjeto}/5 ★
                          </strong>
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {item.ajudaViagem && (
                          <div>
                            <span className="text-xs font-semibold text-texto-mudo block">
                              Como ajudou na viagem:
                            </span>
                            <p className="text-sm text-texto">
                              {item.ajudaViagem}
                            </p>
                          </div>
                        )}

                        {item.sugestoes && (
                          <div>
                            <span className="text-xs font-semibold text-texto-mudo block">
                              Sugestões:
                            </span>
                            <p className="text-sm text-texto-suave">
                              {item.sugestoes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}