"use client";

import { Check, Copy, MapPin } from "lucide-react";
import { formatarDistancia } from "@busca-bus/core";

export default function CartaoPonto({ ponto, selecionado, copiado, onSelecionar, onCopiar }) {
  return (
    <article className={`rounded-lg border p-3 ${selecionado ? "border-marca bg-superficie-sutil ring-2 ring-marca" : "border-borda bg-superficie"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold break-words text-texto">{ponto.nome || "Ponto sem nome"}</h3>
          {ponto.endereco ? <p className="text-sm break-words text-texto-secundario">{ponto.endereco}</p> : null}
        </div>
        {typeof ponto.distancia === "number" ? (
          <p className="shrink-0 text-sm font-semibold text-texto-suave">
            <span className="sr-only">Distância: </span>
            {formatarDistancia(ponto.distancia)}
          </p>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-texto-suave">
        Código <span className="font-roboto-mono text-base font-bold text-texto">{ponto.codigo}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCopiar(ponto.codigo)}
          aria-label={`Copiar código ${ponto.codigo}`}
          className="flex items-center gap-1.5 rounded-md border border-borda-forte px-3 py-1.5 text-sm font-semibold text-texto transition hover:bg-superficie-forte focus:ring-2 focus:ring-foco focus:outline-none"
        >
          {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copiado ? "Copiado" : "Copiar código"}
        </button>
        <button
          type="button"
          onClick={() => onSelecionar(ponto.codigo)}
          aria-pressed={selecionado}
          aria-label={`Ver ${ponto.nome || `ponto ${ponto.codigo}`} no mapa`}
          className="flex items-center gap-1.5 rounded-md border border-borda-forte px-3 py-1.5 text-sm font-semibold text-texto transition hover:bg-superficie-forte focus:ring-2 focus:ring-foco focus:outline-none"
        >
          <MapPin size={16} aria-hidden="true" />
          Ver no mapa
        </button>
      </div>
    </article>
  );
}
