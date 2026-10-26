import { corDoPonto } from "@/components/mapa/pontosMapa";

export default function LegendaPontos({ pontos = [] }) {
  if (!pontos.length) return null;

  return (
    <div
      role="region"
      aria-label="Legenda dos pontos"
      className="absolute bottom-6 left-3 z-[1000] max-h-[40%] max-w-[min(18rem,70vw)] overflow-y-auto rounded-xl border-[3] border-gray-500 bg-white px-3 py-2 text-gray-900 shadow-lg sm:left-6"
    >
      <p className="mb-1 font-bold">Pontos</p>
      <ul className="space-y-1">
        {pontos.map((ponto, indice) => (
          <li key={ponto.codigo ?? indice} className="flex items-center gap-2">
            <span className="bus-marker-ponto shrink-0" style={{ background: corDoPonto(indice) }} aria-hidden="true">
              {indice + 1}
            </span>
            <span className="truncate font-roboto-mono">{ponto.nome || ponto.codigo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
