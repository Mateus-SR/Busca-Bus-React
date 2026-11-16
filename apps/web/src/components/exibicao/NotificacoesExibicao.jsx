"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";
import {
  MINUTOS_CHEGANDO_OPCOES,
  TIPOS_NOTIFICACAO,
  chaveDoOnibus,
  listarSeguidas,
} from "@busca-bus/core";
import ToastsNotificacao from "@/components/exibicao/ToastsNotificacao";
import useMontado from "@/hooks/useMontado";
import useNotificacoesOnibus from "@/hooks/useNotificacoesOnibus";
import { useSeguidasStore } from "@/store/useSeguidasStore";

const MAXIMO_TOASTS = 3;

const ROTULO_EVENTO = {
  [TIPOS_NOTIFICACAO.APARECEU]: "Apareceu no radar",
  [TIPOS_NOTIFICACAO.CHEGANDO]: "Está chegando",
  [TIPOS_NOTIFICACAO.STATUS]: "Ficou atrasado ou adiantado",
  [TIPOS_NOTIFICACAO.SAIU]: "Saiu do radar",
};

const nomeDaLinha = (linha) => `${linha.codigoLetreiro} → ${linha.sentidoLinha}`;

// Botão "Avisos" da exibição: escolhe quais linhas (linha + sentido) seguir e mostra os avisos na tela.
// Tudo acontece no próprio dispositivo, sobre a lista que o radar já recebeu; nada é enviado ao servidor.
export default function NotificacoesExibicao({ codigo, onibus, pronto, pontos }) {
  const montado = useMontado();
  const [aberto, setAberto] = useState(false);
  const [toasts, setToasts] = useState([]);
  const botaoRef = useRef(null);
  const painelRef = useRef(null);

  const seguidasPorExibicao = useSeguidasStore((estado) => estado.seguidas);
  const seguir = useSeguidasStore((estado) => estado.seguir);
  const pararDeSeguir = useSeguidasStore((estado) => estado.pararDeSeguir);
  const atualizarSeguida = useSeguidasStore((estado) => estado.atualizarSeguida);
  const seguidas = useMemo(
    () => listarSeguidas(seguidasPorExibicao, codigo).sort((a, b) => nomeDaLinha(a).localeCompare(nomeDaLinha(b))),
    [seguidasPorExibicao, codigo],
  );

  const nomesDosPontos = useMemo(
    () => new Map((pontos ?? []).map((ponto) => [String(ponto.codigo ?? ""), ponto.nome])),
    [pontos],
  );
  const nomePonto = useCallback((codigoParada) => nomesDosPontos.get(String(codigoParada ?? "")) ?? null, [nomesDosPontos]);

  const fecharToast = useCallback((id) => setToasts((atuais) => atuais.filter((toast) => toast.id !== id)), []);

  const entregar = useCallback((notificacoes, { abaVisivel }) => {
    // Com a aba oculta o toast ninguém veria; a notificação do sistema (camada 2) cuida desse caso.
    if (!abaVisivel) return;
    const agora = Date.now();
    setToasts((atuais) => {
      const tags = new Set(notificacoes.map((notificacao) => notificacao.tag));
      const novos = notificacoes.map((notificacao, indice) => ({
        id: `${notificacao.tag}@${agora}-${indice}`,
        tag: notificacao.tag,
        titulo: notificacao.titulo,
        corpo: notificacao.corpo,
      }));
      return [...atuais.filter((toast) => !tags.has(toast.tag)), ...novos].slice(-MAXIMO_TOASTS);
    });
  }, []);

  useNotificacoesOnibus({ onibus, pronto, seguidas, nomePonto, aoNotificar: entregar });

  const linhasNoRadar = useMemo(() => {
    const seguidasChaves = new Set(seguidas.map((seguida) => seguida.chave));
    const linhas = new Map();
    for (const item of onibus ?? []) {
      const chave = chaveDoOnibus(item);
      if (seguidasChaves.has(chave) || linhas.has(chave)) continue;
      linhas.set(chave, { codigoLetreiro: item.codigoLetreiro, sentidoLinha: item.sentidoLinha });
    }
    return [...linhas.entries()]
      .map(([chave, linha]) => ({ chave, ...linha }))
      .sort((a, b) => nomeDaLinha(a).localeCompare(nomeDaLinha(b)));
  }, [onibus, seguidas]);

  const fechar = useCallback(() => setAberto(false), []);

  useEffect(() => {
    if (!aberto) return;
    const botao = botaoRef.current;
    painelRef.current?.focus();
    const aoPressionar = (evento) => {
      if (evento.key === "Escape") fechar();
    };
    document.addEventListener("keydown", aoPressionar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoPressionar);
      document.body.style.overflow = overflowAnterior;
      botao?.focus();
    };
  }, [aberto, fechar]);

  // Só para testar a entrega sem esperar o radar: não existe no build de produção.
  function simularAviso() {
    const linha = seguidas[0] ?? linhasNoRadar[0] ?? { codigoLetreiro: "273D-10", sentidoLinha: "Metrô Arthur Alvim" };
    entregar([{
      tag: `simulado:${Date.now()}`,
      titulo: `Linha ${linha.codigoLetreiro} · chegando`,
      corpo: `Sentido ${linha.sentidoLinha} · previsão simulada`,
      eventos: [],
    }], { abaVisivel: true });
  }

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-borda px-2 py-1 text-xs font-semibold text-texto-suave transition hover:bg-superficie-alt"
      >
        <Bell size={14} aria-hidden="true" />
        Avisos
        {montado && seguidas.length > 0 && (
          <span className="rounded-full bg-marca px-1.5 text-[11px] leading-5 text-sobre-marca">
            <span className="sr-only">, seguindo </span>
            {seguidas.length}
          </span>
        )}
      </button>

      <ToastsNotificacao toasts={toasts} aoFechar={fecharToast} />

      {aberto && montado && createPortal(
        <div
          className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-[1px]"
          onClick={fechar}
          role="presentation"
        >
          <div
            ref={painelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="avisos-titulo"
            onClick={(evento) => evento.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-borda-suave bg-superficie p-5 text-left text-texto-forte shadow-xl focus:outline-none"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="avisos-titulo" className="text-xl font-extrabold">Avisos das linhas</h2>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="cursor-pointer rounded-md p-1 text-texto-mudo transition hover:bg-superficie-alt"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-sm text-texto-suave">
              Escolha uma linha e o sentido para receber avisos aqui, neste dispositivo, enquanto esta página estiver
              aberta. Nada é enviado ao servidor.
            </p>

            <h3 className="mt-5 text-sm font-extrabold uppercase">Linhas que você segue</h3>
            {seguidas.length === 0 ? (
              <p className="mt-2 text-sm text-texto-mudo">Você ainda não segue nenhuma linha nesta exibição.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-3">
                {seguidas.map((seguida) => (
                  <li key={seguida.chave}>
                    <div className="rounded-xl border border-borda p-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 font-bold break-words">{nomeDaLinha(seguida)}</span>
                        <button
                          type="button"
                          onClick={() => pararDeSeguir(codigo, seguida.chave)}
                          className="shrink-0 cursor-pointer rounded-md border border-borda px-2 py-1 text-xs font-semibold text-texto-suave transition hover:bg-superficie-alt"
                        >
                          Deixar de seguir
                        </button>
                      </div>
                      <label className="mt-3 flex items-center gap-2 text-sm">
                        <span>Avisar quando faltar até</span>
                        <select
                          value={seguida.minutosChegando}
                          onChange={(evento) => atualizarSeguida(codigo, seguida.chave, { minutosChegando: Number(evento.target.value) })}
                          className="cursor-pointer rounded-md border border-borda bg-superficie px-2 py-1 text-sm font-semibold"
                        >
                          {MINUTOS_CHEGANDO_OPCOES.map((minutos) => (
                            <option key={minutos} value={minutos}>{minutos} min</option>
                          ))}
                        </select>
                      </label>
                      <fieldset className="mt-3">
                        <legend className="text-xs font-semibold text-texto-mudo">Avisar quando</legend>
                        <div className="mt-1 grid gap-1 sm:grid-cols-2">
                          {Object.values(TIPOS_NOTIFICACAO).map((tipo) => (
                            <label key={tipo} className="flex cursor-pointer items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={seguida.eventos[tipo]}
                                onChange={(evento) => atualizarSeguida(codigo, seguida.chave, { eventos: { [tipo]: evento.target.checked } })}
                                className="h-4 w-4 cursor-pointer"
                              />
                              <span>{ROTULO_EVENTO[tipo]}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mt-5 text-sm font-extrabold uppercase">No radar agora</h3>
            {linhasNoRadar.length === 0 ? (
              <p className="mt-2 text-sm text-texto-mudo">Nenhuma outra linha no radar neste momento.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {linhasNoRadar.map((linha) => (
                  <li key={linha.chave}>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-borda px-3 py-2">
                      <span className="min-w-0 text-sm font-semibold break-words">{nomeDaLinha(linha)}</span>
                      <button
                        type="button"
                        onClick={() => seguir(codigo, linha)}
                        className="shrink-0 cursor-pointer rounded-md bg-marca px-3 py-1 text-xs font-semibold text-sobre-marca transition hover:bg-marca-forte"
                      >
                        Seguir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {process.env.NODE_ENV !== "production" && (
              <button
                type="button"
                onClick={simularAviso}
                className="mt-5 cursor-pointer text-xs text-texto-desabilitado underline hover:text-texto-suave"
              >
                Simular aviso (só em desenvolvimento)
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
