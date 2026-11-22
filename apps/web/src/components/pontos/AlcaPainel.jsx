"use client";

// Alça do painel inferior (só no celular): mostra o resumo do que está no painel e muda o tamanho dele
// ao arrastar, tocar ou usar as setas do teclado. `touch-none` impede o navegador de rolar a página no lugar do arrasto.
export default function AlcaPainel({ estado, resumo, propsAlca, idPainel }) {
  const acao = estado === "recolhido" ? "Abrir painel" : estado === "medio" ? "Expandir painel" : "Recolher painel";
  return (
    <button
      type="button"
      {...propsAlca}
      aria-expanded={estado !== "recolhido"}
      aria-controls={idPainel}
      className="flex w-full shrink-0 touch-none flex-col items-center gap-1.5 px-4 pt-2 pb-2 text-left select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-inset lg:hidden"
    >
      <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-borda-forte" />
      <span className="flex min-h-8 w-full items-center justify-between gap-3 text-sm font-bold text-texto">
        <span className="min-w-0 truncate">{resumo}</span>
        <span className="shrink-0 text-xs font-semibold text-texto-suave">{acao}</span>
      </span>
    </button>
  );
}
