import { CORES_EVENTO, horaCurta, posicaoVertical } from '@/utils/calendario';

export default function EventoBloco({ evento, coluna, totalColunas, onAbrir }) {
	const { top, height } = posicaoVertical(evento);
	const largura = 100 / totalColunas;
	const estreito = totalColunas > 1;

	return (
		<button
			type="button"
			title={`${evento.titulo} (${horaCurta(evento.inicio)} às ${horaCurta(evento.fim)})`}
			onClick={(e) => onAbrir(evento, e.currentTarget)}
			aria-label={`${evento.tipo}: ${evento.titulo}, das ${horaCurta(evento.inicio)} às ${horaCurta(evento.fim)}`}
			style={{
				top,
				height,
				left: `calc(${coluna * largura}% + 2px)`,
				width: `calc(${largura}% - 4px)`,
			}}
			className={`absolute cursor-pointer overflow-hidden rounded-md py-0.5 text-center leading-tight font-extrabold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
				estreito ? 'px-0.5 text-[10px] tracking-tighter' : 'px-1 text-[11px]'
			} ${CORES_EVENTO[evento.cor]}`}
		>
			<span className="block truncate uppercase">{evento.tipo}</span>
			<span className="line-clamp-2">{evento.titulo}</span>
		</button>
	);
}
