import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
	CORES_EVENTO,
	adicionarDias,
	chaveDoDia,
	dataLonga,
	diasDoMes,
	mesExtenso,
	mesmoDia,
} from '@/utils/calendario';

const INICIAIS_DOS_DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function MiniCalendario({
	mes,
	semanaInicio,
	hoje,
	coresDosDias,
	onMudarMes,
	onEscolherDia,
}) {
	const dias = diasDoMes(mes);
	const semanaFim = adicionarDias(semanaInicio, 7);

	return (
		<div className="font-inter rounded-xl border border-gray-300 bg-white p-3">
			<div className="mb-2 flex items-center justify-between">
				<h2 className="text-sm font-bold">{mesExtenso(mes)}</h2>
				<div className="flex">
					<button
						type="button"
						onClick={() => onMudarMes(-1)}
						aria-label="Mês anterior"
						className="cursor-pointer rounded-full p-1 transition hover:bg-gray-200"
					>
						<ChevronLeft size={18} strokeWidth={3} />
					</button>
					<button
						type="button"
						onClick={() => onMudarMes(1)}
						aria-label="Próximo mês"
						className="cursor-pointer rounded-full p-1 transition hover:bg-gray-200"
					>
						<ChevronRight size={18} strokeWidth={3} />
					</button>
				</div>
			</div>

			<div
				className="grid grid-cols-7 text-center text-[11px] font-semibold text-gray-500"
				aria-hidden="true"
			>
				{INICIAIS_DOS_DIAS.map((inicial, i) => (
					<span key={i} className="py-1">
						{inicial}
					</span>
				))}
			</div>

			<div className="grid grid-cols-7">
				{dias.map((dia) => {
					const ehDoMes = dia.getMonth() === mes.getMonth();
					const ehHoje = mesmoDia(dia, hoje);
					const naSemanaAberta = dia >= semanaInicio && dia < semanaFim;
					const cores = coresDosDias.get(chaveDoDia(dia)) ?? [];

					return (
						<button
							key={dia.getTime()}
							type="button"
							onClick={() => onEscolherDia(dia)}
							aria-label={`${dataLonga(dia)}${cores.length ? ', com eventos' : ''}`}
							aria-current={ehHoje ? 'date' : undefined}
							className={`flex h-10 cursor-pointer flex-col items-center justify-center text-xs transition ${
								naSemanaAberta ? 'bg-gray-200' : 'hover:bg-gray-100'
							} ${dia.getDay() === 0 ? 'rounded-l-lg' : ''} ${dia.getDay() === 6 ? 'rounded-r-lg' : ''} ${
								ehDoMes ? 'text-black' : 'text-gray-400'
							}`}
						>
							<span
								className={`flex h-6 w-6 items-center justify-center rounded-full ${
									ehHoje ? 'bg-sptrans font-bold text-white' : ''
								}`}
							>
								{dia.getDate()}
							</span>

							<span
								className="flex h-1.5 items-center gap-0.5"
								aria-hidden="true"
							>
								{cores.map((cor) => (
									<span
										key={cor}
										className={`h-1.5 w-1.5 rounded-full ${CORES_EVENTO[cor]}`}
									/>
								))}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
