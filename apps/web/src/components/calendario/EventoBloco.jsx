import { CORES_EVENTO, horaCurta, posicaoVertical } from "@/utils/calendario";

// O "quadradinho" colorido que aparece dentro da grade (ex.: PALESTRA / Dados & I.A).
// É um <button>: dá para clicar, usar Tab e apertar Enter.
export default function EventoBloco({ evento, coluna, totalColunas, onAbrir }) {
  const { top, height } = posicaoVertical(evento);
  const largura = 100 / totalColunas; // 1 evento = 100%, 2 lado a lado = 50% cada...

  return (
    <button
      type="button"
      onClick={(e) => onAbrir(evento, e.currentTarget)}
      aria-label={`${evento.tipo}: ${evento.titulo}, das ${horaCurta(evento.inicio)} às ${horaCurta(evento.fim)}`}
      style={{
        top,
        height,
        left: `calc(${coluna * largura}% + 2px)`,
        width: `calc(${largura}% - 4px)`,
      }}
      className={`absolute cursor-pointer overflow-hidden rounded-md px-1 py-0.5 text-center text-[11px] leading-tight font-extrabold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${CORES_EVENTO[evento.cor]}`}
    >
      <span className="block truncate uppercase">{evento.tipo}</span>
      <span className="line-clamp-2">{evento.titulo}</span>
    </button>
  );
}