"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import useMontado from "@/hooks/useMontado";

// Barra fixa embaixo com os pontos marcados para a mesma exibição. Fica no body para não depender do scroll nem do z-index do painel/mapa.
export default function BarraSelecao({ marcados, limite, onRemover, onLimpar }) {
  const montado = useMontado();
  if (!montado || !marcados.length) return null;
  const href = `/configuracao?${marcados.map((ponto) => `parada=${encodeURIComponent(ponto.codigo)}`).join("&")}`;
  const noLimite = marcados.length >= limite;

  return createPortal(
    <div role="region" aria-label="Pontos selecionados" className="fixed inset-x-0 bottom-0 z-[1100] border-t-2 border-borda-forte bg-superficie p-3 shadow-[0_-4px_12px_rgb(0_0_0/20%)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
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
            {marcados.length === 1 ? "Criar exibição com o selecionado" : "Criar exibição com os selecionados"}
          </Link>
          <button type="button" onClick={onLimpar} className="rounded-md border border-borda-forte px-4 py-2 text-sm font-semibold text-texto transition hover:bg-superficie-forte focus:ring-2 focus:ring-foco focus:outline-none">
            Limpar seleção
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
