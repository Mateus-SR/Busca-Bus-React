import { CLASSE_PONTO, corDoPonto } from "@/components/mapa/pontosMapa";

export default function LegendaPontos({ pontos = [] }) {
  if (!pontos.length) return null;

  return (
    <div
      role="region"
      aria-label="Legenda dos pontos"
      className="absolute bottom-6 left-3 z-[1000] max-h-[40%] max-w-[min(20rem,75vw)] overflow-y-auto rounded-xl border-[3] border-borda-enfase bg-superficie px-3 py-2 text-texto-forte shadow-lg sm:left-6"
    >
      <p className="mb-1 font-bold">Pontos</p>
      <ul className="space-y-2">
        {pontos.map((ponto, indice) => (
          <li key={ponto.codigo ?? indice} className="flex items-start gap-2">
            <span className={`${CLASSE_PONTO} mt-0.5 shrink-0`} style={{ background: corDoPonto(indice) }} aria-hidden="true">
              {indice + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm leading-tight font-bold break-words">{ponto.nome || `Ponto ${ponto.codigo}`}</span>
              {ponto.endereco ? <span className="block text-xs leading-tight break-words text-texto-secundario">{ponto.endereco}</span> : null}
              <span className="block font-roboto-mono text-xs text-texto-secundario">Código {ponto.codigo}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
