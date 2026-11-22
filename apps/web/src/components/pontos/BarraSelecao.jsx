"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronUp, Clock, Plus, X } from "lucide-react";
import useMontado from "@/hooks/useMontado";
import { montarHrefCriador } from "@/components/pontos/hrefCriador";

// Barra fixa embaixo com os pontos marcados para a mesma exibição. Fica no body para não depender do scroll nem do z-index do painel/mapa.
// No celular ela é compacta (uma linha: contagem, ação principal e um botão que abre os detalhes) e informa a própria altura em
// `onAltura`, para o painel inferior se apoiar nela. No desktop continua como antes.
export default function BarraSelecao({ marcados, limite, onRemover, onLimpar, origemCriador = false, codigoEdicao = null, onCriarTemporaria, criandoTemporaria = false, erroTemporaria = "", onAltura }) {
  const montado = useMontado();
  const [detalhes, setDetalhes] = useState(false);
  const raizRef = useRef(null);
  const visivel = montado && marcados.length > 0;

  useEffect(() => {
    const raiz = raizRef.current;
    if (!visivel || !raiz || !onAltura) return undefined;
    const observador = new ResizeObserver(() => onAltura(raiz.offsetHeight));
    observador.observe(raiz);
    return () => {
      observador.disconnect();
      onAltura(0);
    };
  }, [visivel, onAltura]);

  if (!visivel) return null;
  const href = montarHrefCriador(marcados, { origemCriador, codigoEdicao });
  const noLimite = marcados.length >= limite;
  const textoTemporaria = "A exibição temporária não precisa de conta: usa tolerância de 2 min (atraso e adianto) e distância de 20 min, e some depois de 24 horas.";
  const botaoTemporaria = onCriarTemporaria ? (
    <button type="button" onClick={onCriarTemporaria} disabled={criandoTemporaria} className="flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-marca px-4 py-2 text-sm font-bold text-marca transition hover:bg-superficie-forte focus:ring-2 focus:ring-foco focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-0 contraste:border-acento contraste:text-acento">
      <Clock size={16} aria-hidden="true" />
      {criandoTemporaria ? "Criando..." : "Ver exibição temporária"}
    </button>
  ) : null;

  return createPortal(
    <div ref={raizRef} role="region" aria-label="Pontos selecionados" className="fixed inset-x-0 bottom-0 z-[1100] border-t-2 border-borda-forte bg-superficie p-3 shadow-[0_-4px_12px_rgb(0_0_0/20%)] max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="lg:hidden">
        <div className="flex items-center gap-2">
          <p aria-live="polite" className="shrink-0 text-sm font-bold text-texto">
            {marcados.length} de {limite}<span className="sr-only"> {marcados.length === 1 ? "ponto selecionado" : "pontos selecionados"}</span>
          </p>
          <Link href={href} className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-marca px-3 text-sm font-bold text-sobre-marca transition hover:bg-marca-forte focus:ring-2 focus:ring-foco focus:outline-none">
            <Plus size={16} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{origemCriador ? "Voltar ao criador" : "Criar exibição"}</span>
          </Link>
          <button type="button" onClick={() => setDetalhes((atual) => !atual)} aria-expanded={detalhes} aria-controls="detalhes-selecao" aria-label={detalhes ? "Ocultar detalhes da seleção" : "Ver detalhes da seleção"} className="flex size-11 shrink-0 items-center justify-center rounded-md border border-borda-forte text-texto focus:ring-2 focus:ring-foco focus:outline-none">
            <ChevronUp size={20} aria-hidden="true" className={`transition-transform motion-reduce:transition-none ${detalhes ? "rotate-180" : ""}`} />
          </button>
        </div>
        {detalhes ? (
          <div id="detalhes-selecao" className="mt-3 flex max-h-[45dvh] flex-col gap-3 overflow-y-auto">
            <ul className="flex flex-wrap gap-2">
              {marcados.map((ponto) => (
                <li key={ponto.codigo} className="flex items-center gap-1 rounded-full border border-borda-forte py-0.5 pr-1 pl-3 text-sm text-texto">
                  <span className="font-roboto-mono font-bold">{ponto.codigo}</span>
                  <button type="button" onClick={() => onRemover(ponto.codigo)} aria-label={`Remover o ponto ${ponto.nome || ponto.codigo} da seleção`} className="flex size-9 items-center justify-center rounded-full focus:ring-2 focus:ring-foco focus:outline-none">
                    <X size={16} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            {noLimite ? <p className="text-xs text-texto-suave">Limite de {limite} pontos por exibição.</p> : null}
            <div className="grid gap-2">
              {botaoTemporaria}
              <button type="button" onClick={onLimpar} className="min-h-11 rounded-md border border-borda-forte px-4 py-2 text-sm font-semibold text-texto transition hover:bg-superficie-forte focus:ring-2 focus:ring-foco focus:outline-none">
                Limpar seleção
              </button>
            </div>
            {onCriarTemporaria ? <p className="text-xs text-texto-suave">{textoTemporaria}</p> : null}
          </div>
        ) : null}
        {erroTemporaria ? <p role="alert" className="mt-2 text-sm font-semibold text-erro-forte">{erroTemporaria}</p> : null}
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-2 max-lg:hidden">
        <p aria-live="polite" className="text-sm font-bold text-texto">
          {marcados.length} de {limite} {marcados.length === 1 ? "ponto selecionado" : "pontos selecionados"}
          {noLimite ? <span className="font-normal text-texto-suave"> (limite por exibição)</span> : null}
        </p>
        <ul className="flex flex-wrap gap-2">
          {marcados.map((ponto) => (
            <li key={ponto.codigo} className="flex items-center gap-1 rounded-full border border-borda-forte py-0.5 pr-1 pl-3 text-sm text-texto">
              <span className="font-roboto-mono font-bold">{ponto.codigo}</span>
              <button type="button" onClick={() => onRemover(ponto.codigo)} aria-label={`Remover o ponto ${ponto.nome || ponto.codigo} da seleção`} className="flex size-6 items-center justify-center rounded-full focus:ring-2 focus:ring-foco focus:outline-none">
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Link href={href} className="flex items-center gap-1.5 rounded-md bg-marca px-4 py-2 text-sm font-bold text-sobre-marca transition hover:bg-marca-forte focus:ring-2 focus:ring-foco focus:outline-none">
            <Plus size={16} aria-hidden="true" />
            {origemCriador
              ? "Voltar ao criador com os selecionados"
              : marcados.length === 1 ? "Criar exibição com o selecionado" : "Criar exibição com os selecionados"}
          </Link>
          {botaoTemporaria}
          <button type="button" onClick={onLimpar} className="rounded-md border border-borda-forte px-4 py-2 text-sm font-semibold text-texto transition hover:bg-superficie-forte focus:ring-2 focus:ring-foco focus:outline-none">
            Limpar seleção
          </button>
        </div>
        {onCriarTemporaria ? <p className="text-xs text-texto-suave">{textoTemporaria}</p> : null}
        {erroTemporaria ? <p role="alert" className="text-sm font-semibold text-erro-forte">{erroTemporaria}</p> : null}
      </div>
    </div>,
    document.body,
  );
}
