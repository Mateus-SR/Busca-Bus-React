'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AgendaDoDia from './AgendaDoDia';
import EventoBloco from './EventoBloco';
import EventoPopup from './EventoPopup';
import MiniCalendario from './MiniCalendario';
import {
	ALTURA_HORA,
	HORA_FIM,
	HORA_INICIO,
	MARGEM_TOPO,
	adicionarDias,
	coresPorDia,
	distribuirColunas,
	diasDaSemana,
	eventosDoDia,
	inicioDaSemana,
	mesDaSemana,
	mesmoDia,
	nomeDoMes,
	posicaoVertical,
	prepararEventos,
	siglaDiaSemana,
} from '@/utils/calendario';

const HORAS = Array.from(
	{ length: HORA_FIM - HORA_INICIO },
	(_, i) => HORA_INICIO + i
);

const COLUNAS = 'grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]';

export default function CalendarioView({
	eventos: eventosBrutos,
	ehAdministrador,
	onExcluirEvento,
}) {
	const [hoje, setHoje] = useState(null);
	const [inicioSemana, setInicioSemana] = useState(null);
	const [diaFoco, setDiaFoco] = useState(null);
	const [mesMini, setMesMini] = useState(null);
	const [miniAberto, setMiniAberto] = useState(false);
	const [eventoAberto, setEventoAberto] = useState(null);

	const gatilhoRef = useRef(null);
	const rolagemRef = useRef(null);

	const eventos = useMemo(
		() => prepararEventos(eventosBrutos),
		[eventosBrutos]
	);
	const coresDosDias = useMemo(() => coresPorDia(eventos), [eventos]);

	useEffect(() => {
		const agora = new Date();
		const inicio = inicioDaSemana(agora);
		setHoje(agora);
		setInicioSemana(inicio);
		setDiaFoco(
			new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
		);
		setMesMini(mesDaSemana(inicio));
	}, []);

	useEffect(() => {
		if (!inicioSemana || !rolagemRef.current) return;

		const fimSemana = adicionarDias(inicioSemana, 7);
		const daSemana = eventos.filter(
			(e) => e.inicio >= inicioSemana && e.inicio < fimSemana
		);

		const primeiroTop = daSemana.length
			? Math.min(...daSemana.map((e) => posicaoVertical(e).top))
			: 0;
		rolagemRef.current.scrollTop = Math.max(0, primeiroTop - 12);
	}, [inicioSemana, eventos]);

	const abrirEvento = (evento, botao) => {
		gatilhoRef.current = botao;
		setEventoAberto(evento);
	};

	const fecharEvento = useCallback(() => {
		setEventoAberto(null);
		gatilhoRef.current?.focus();
	}, []);

	if (!inicioSemana || !mesMini || !diaFoco) {
		return (
			<div
				className="mt-6 h-96 animate-pulse rounded bg-gray-100"
				aria-hidden="true"
			/>
		);
	}

	const dias = diasDaSemana(inicioSemana);
	const mesInicio = nomeDoMes(dias[0]);
	const mesFim = nomeDoMes(dias[6]);
	const doisMeses = mesInicio !== mesFim;
	const abreviar = (mes) => mes.slice(0, 3);

	const irParaSemanaDe = (data) => {
		const dia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
		const inicio = inicioDaSemana(dia);
		setDiaFoco(dia);
		setInicioSemana(inicio);
		setMesMini(mesDaSemana(inicio));
	};

	const mudarSemana = (quantidade) =>
		irParaSemanaDe(adicionarDias(diaFoco, quantidade * 7));

	const mudarMesMini = (quantidade) =>
		setMesMini(
			(atual) => new Date(atual.getFullYear(), atual.getMonth() + quantidade, 1)
		);

	return (
		<section aria-label="Calendário semanal de eventos" className="mt-4">
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
				<div className="flex items-baseline gap-2">
					<h1 className="text-3xl font-extrabold tracking-tight whitespace-nowrap sm:text-4xl">
						{doisMeses ? (
							<>
								<span className="lg:hidden">
									{abreviar(mesInicio)} / {abreviar(mesFim)}
								</span>
								<span className="hidden lg:inline">
									{mesInicio} / {mesFim}
								</span>
							</>
						) : (
							mesInicio
						)}
					</h1>
					<span className="text-sm font-semibold text-gray-500">
						{dias[6].getFullYear()}
					</span>
				</div>

				<div className="flex items-center justify-between sm:ml-auto sm:justify-end sm:gap-1">
					<button
						type="button"
						onClick={() => irParaSemanaDe(new Date())}
						className="cursor-pointer rounded-xl border-2 border-gray-300 px-3.5 py-1.5 text-sm font-bold transition hover:bg-gray-100 sm:mr-2"
					>
						Hoje
					</button>
					<div className="flex gap-1">
						<button
							type="button"
							onClick={() => mudarSemana(-1)}
							aria-label="Semana anterior"
							className="cursor-pointer rounded-full p-1.5 transition hover:bg-gray-200"
						>
							<ChevronLeft size={24} strokeWidth={3} />
						</button>
						<button
							type="button"
							onClick={() => mudarSemana(1)}
							aria-label="Próxima semana"
							className="cursor-pointer rounded-full p-1.5 transition hover:bg-gray-200"
						>
							<ChevronRight size={24} strokeWidth={3} />
						</button>
					</div>
				</div>
			</div>

			<div className="xl:grid xl:grid-cols-[16rem_minmax(0,1fr)] xl:items-start xl:gap-6">
				<aside aria-label="Calendário do mês" className="mb-4 xl:mb-0">
					<button
						type="button"
						onClick={() => setMiniAberto((aberto) => !aberto)}
						aria-expanded={miniAberto}
						aria-controls="mini-calendario"
						className="cursor-pointer rounded-xl border-2 border-gray-300 px-3.5 py-1.5 text-sm font-bold transition hover:bg-gray-100 xl:hidden"
					>
						{miniAberto
							? 'Esconder calendário do mês'
							: 'Ver calendário do mês'}
					</button>

					<div
						id="mini-calendario"
						className={`max-w-xs xl:mt-0 xl:block ${miniAberto ? 'mt-3 block' : 'hidden'}`}
					>
						<MiniCalendario
							mes={mesMini}
							semanaInicio={inicioSemana}
							hoje={hoje}
							coresDosDias={coresDosDias}
							onMudarMes={mudarMesMini}
							onEscolherDia={irParaSemanaDe}
						/>
					</div>
				</aside>

				<AgendaDoDia
					dias={dias}
					diaFoco={diaFoco}
					hoje={hoje}
					eventos={eventos}
					coresDosDias={coresDosDias}
					onEscolherDia={setDiaFoco}
					onAbrir={abrirEvento}
				/>

				<div
					ref={rolagemRef}
					role="region"
					tabIndex={0}
					aria-label="Grade de horários da semana"
					className="hidden max-h-[max(24rem,calc(100dvh-13rem))] overflow-auto border border-gray-500 bg-white md:block"
				>
					<div className="min-w-[44rem]">
						<div
							className={`${COLUNAS} sticky top-0 z-20 border-b border-gray-500 bg-white`}
						>
							<div className="sticky left-0 bg-white" />
							{dias.map((dia) => {
								const ehHoje = mesmoDia(dia, hoje);
								return (
									<div
										key={dia.getTime()}
										className="flex flex-col items-center gap-1 border-l border-gray-400 py-2"
									>
										<span className="text-xs font-medium">
											{siglaDiaSemana(dia)}
										</span>
										<div
											aria-current={ehHoje ? 'date' : undefined}
											className={`flex h-11 w-11 items-center justify-center rounded-full text-2xl ${
												ehHoje
													? 'border-sptrans bg-sptrans border-4 font-bold text-white'
													: 'bg-gray-200'
											}`}
										>
											{dia.getDate()}
										</div>
									</div>
								);
							})}
						</div>

						<div className={COLUNAS}>
							<div
								className="sticky left-0 z-10 bg-white"
								style={{ paddingTop: MARGEM_TOPO }}
							>
								{HORAS.map((hora) => (
									<div
										key={hora}
										className="relative"
										style={{ height: ALTURA_HORA }}
									>
										<span className="absolute top-0 right-2 -translate-y-1/2 text-xs text-gray-600">
											{String(hora).padStart(2, '0')}:00
										</span>
									</div>
								))}
							</div>

							{dias.map((dia) => (
								<div
									key={dia.getTime()}
									className="relative border-l border-gray-400"
									style={{ paddingTop: MARGEM_TOPO }}
								>
									{HORAS.map((hora, i) => (
										<div
											key={hora}
											className={`border-t border-gray-300 ${i === HORAS.length - 1 ? 'border-b' : ''}`}
											style={{ height: ALTURA_HORA }}
										/>
									))}

									{distribuirColunas(eventosDoDia(eventos, dia)).map(
										({ evento, coluna, totalColunas }) => (
											<EventoBloco
												key={evento.id_evento}
												evento={evento}
												coluna={coluna}
												totalColunas={totalColunas}
												onAbrir={abrirEvento}
											/>
										)
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<EventoPopup
				evento={eventoAberto}
				onClose={fecharEvento}
				ehAdministrador={ehAdministrador}
				onExcluirEvento={onExcluirEvento}
			/>
		</section>
	);
}
