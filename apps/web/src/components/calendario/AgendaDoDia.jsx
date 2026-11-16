import {
	CORES_EVENTO,
	chaveDoDia,
	dataPorExtenso,
	eventosDoDia,
	horaCurta,
	mesmoDia,
	siglaDiaSemana,
} from '@/utils/calendario';

export default function AgendaDoDia({
	dias,
	diaFoco,
	hoje,
	eventos,
	coresDosDias,
	onEscolherDia,
	onAbrir,
}) {
	const eventosDoFoco = eventosDoDia(eventos, diaFoco);

	return (
		<div className="md:hidden">
			<div role="group" aria-label="Dias da semana" className="grid grid-cols-7 gap-0.5">
				{dias.map((dia) => {
					const selecionado = mesmoDia(dia, diaFoco);
					const ehHoje = mesmoDia(dia, hoje);
					const cores = coresDosDias.get(chaveDoDia(dia)) ?? [];

					return (
						<button
							key={dia.getTime()}
							type="button"
							onClick={() => onEscolherDia(dia)}
							aria-pressed={selecionado}
							aria-current={ehHoje ? 'date' : undefined}
							aria-label={`${dataPorExtenso(dia)}${cores.length ? ', com eventos' : ''}`}
							className="flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-xl py-1.5 transition hover:bg-gray-100"
						>
							<span className="text-[11px] font-medium">
								{siglaDiaSemana(dia).replace('.', '')}
							</span>

							<span
								className={`flex aspect-square w-full max-w-9 items-center justify-center rounded-full border-2 text-base ${
									selecionado
										? 'border-sptrans bg-sptrans font-bold text-white'
										: ehHoje
											? 'border-sptrans bg-gray-200 font-bold'
											: 'border-transparent bg-gray-200'
								}`}
							>
								{dia.getDate()}
							</span>

							<span className="flex h-1.5 items-center gap-0.5" aria-hidden="true">
								{cores.map((cor) => (
									<span key={cor} className={`h-1.5 w-1.5 rounded-full ${CORES_EVENTO[cor]}`} />
								))}
							</span>
						</button>
					);
				})}
			</div>

			<h2 className="mt-5 mb-3 text-lg font-bold">{dataPorExtenso(diaFoco)}</h2>

			{eventosDoFoco.length === 0 ? (
				<p className="rounded-xl border border-dashed border-gray-400 p-6 text-center text-sm text-gray-600">
					Nenhum evento neste dia.
				</p>
			) : (
				<ul className="space-y-3">
					{eventosDoFoco.map((evento) => (
						<li key={evento.id_evento}>
							<button
								type="button"
								onClick={(e) => onAbrir(evento, e.currentTarget)}
								className="flex w-full cursor-pointer overflow-hidden rounded-xl border border-gray-400 text-left transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
							>
								<span aria-hidden="true" className={`w-2 shrink-0 ${CORES_EVENTO[evento.cor]}`} />
								<span className="min-w-0 flex-1 p-3">
									<span className="block text-xs font-bold text-gray-600 uppercase">
										{evento.tipo}
									</span>
									<span className="block text-base leading-snug font-semibold break-words">
										{evento.titulo}
									</span>
									<span className="mt-1 block text-sm text-gray-700">
										{horaCurta(evento.inicio)} às {horaCurta(evento.fim)} · {evento.local}
									</span>
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}