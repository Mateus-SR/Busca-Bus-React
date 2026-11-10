"use client";

import CartaoPonto from "@/components/pontos/CartaoPonto";

export default function ListaPontos({ rotulo, pontos, selecionado, copiado, onSelecionar, onCopiar }) {
  if (!pontos.length) return null;
  return (
    <ol aria-label={rotulo} className="flex flex-col gap-3">
      {pontos.map((ponto) => (
        <li key={ponto.codigo}>
          <CartaoPonto ponto={ponto} selecionado={ponto.codigo === selecionado} copiado={copiado === ponto.codigo} onSelecionar={onSelecionar} onCopiar={onCopiar} />
        </li>
      ))}
    </ol>
  );
}
