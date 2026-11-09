'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listarEventosDaSemana } from '@/lib/eventosApi';

function inicioDaSemana(data) {
	const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
	inicio.setDate(inicio.getDate() - inicio.getDay());
	return inicio;
}

function dataDoEvento(evento) {
	return new Date(evento.inicio);
}

function chaveDoDia(data) {
	return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

function nomeDoDia(data) {
	return data.toLocaleDateString('pt-BR', {
		weekday: 'long',
	});
}

function dataDoDia(data) {
	return data.toLocaleDateString('pt-BR', {
		day: 'numeric',
		month: 'long',
	});
}

function descricaoRelativa(data) {
	const hoje = new Date();
	const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
	const diaSemHora = new Date(data.getFullYear(), data.getMonth(), data.getDate());
	const diferenca = Math.round((diaSemHora - hojeSemHora) / 86400000);

	if (diferenca === 0) return 'Hoje';
	if (diferenca === 1) return 'Amanhã';
	if (diferenca > 1) return `Faltam ${diferenca} dias`;
	if (diferenca === -1) return 'Ontem';
	return `Há ${Math.abs(diferenca)} dias`;
}

function horaDoEvento(evento) {
	return dataDoEvento(evento).toLocaleTimeString('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	});
}

export default function EventosDaSemana() {
	const { usuario, carregando } = useAuth();
	const [eventos, setEventos] = useState(null);
	const [erro, setErro] = useState('');

	const semana = useMemo(() => {
		const inicio = inicioDaSemana(new Date());
		const fim = new Date(inicio);
		fim.setDate(fim.getDate() + 7);
		return { inicio, fim };
	}, []);

	const carregar = useCallback(async () => {
		if (!usuario?.fac_id) return;

		try {
			setErro('');
			const lista = await listarEventosDaSemana({
				facId: usuario.fac_id,
				inicio: semana.inicio,
				fim: semana.fim,
			});
			setEventos(lista);
		} catch (e) {
			setErro(e.message);
		}
	}, [semana, usuario?.fac_id]);

	useEffect(() => {
		if (!carregando) carregar();
	}, [carregando, carregar]);

	const eventosPorDia = useMemo(() => {
		const grupos = new Map();
		for (const evento of eventos ?? []) {
			const data = dataDoEvento(evento);
			const chave = chaveDoDia(data);
			const grupo = grupos.get(chave) ?? { data, eventos: [] };
			grupo.eventos.push(evento);
			grupos.set(chave, grupo);
		}
		return [...grupos.values()];
	}, [eventos]);

	if (carregando || (usuario?.fac_id && !eventos && !erro)) {
		return (
			<section aria-label="Eventos desta semana" className="mt-10">
				<div className="h-40 animate-pulse rounded-2xl bg-gray-100" aria-hidden="true" />
			</section>
		);
	}

	if (!usuario?.fac_id) {
		return (
			<section aria-label="Eventos desta semana" className="mt-10 overflow-hidden rounded-3xl border border-borda bg-superficie shadow-lg shadow-black/5 lg:mt-0">
				<div className="bg-marca p-5 text-sobre-marca sm:p-6">
					<div className="flex items-center gap-3">
						<div className="rounded-2xl bg-white/15 p-2.5">
							<CalendarDays size={22} aria-hidden="true" />
						</div>
						<div>
							<p className="text-xs font-bold tracking-[0.16em] uppercase opacity-80">Agenda da instituição</p>
							<h2 className="mt-1 text-xl font-extrabold">Eventos desta semana</h2>
						</div>
					</div>
				</div>
				<div className="p-5 sm:p-6">
				<p className="mt-2 text-sm text-texto-suave">
					Selecione sua instituição para ver os eventos publicados no calendário.
				</p>
				<Link
					href="/configuracao"
					className="mt-4 inline-flex rounded-xl bg-marca px-4 py-2 text-sm font-bold text-sobre-marca transition hover:bg-marca-forte"
				>
					Escolher instituição
				</Link>
				</div>
			</section>
		);
	}

	if (erro) {
		return (
			<section aria-label="Eventos desta semana" className="mt-10 rounded-3xl border border-erro/30 bg-superficie p-5 shadow-lg shadow-black/5 lg:mt-0 sm:p-6">
				<p role="alert" className="text-sm font-semibold text-erro">{erro}</p>
				<button
					type="button"
					onClick={carregar}
					className="mt-3 rounded-xl border-2 border-gray-300 px-4 py-2 text-sm font-bold transition hover:bg-gray-100"
				>
					Tentar de novo
				</button>
			</section>
		);
	}

	return (
		<section aria-label="Eventos desta semana" className="mt-10 overflow-hidden rounded-3xl border border-borda bg-superficie shadow-xl shadow-black/5 lg:mt-0">
			<div className="bg-marca p-5 text-sobre-marca sm:p-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="rounded-2xl bg-white/15 p-2.5">
							<CalendarDays size={22} aria-hidden="true" />
						</div>
						<div>
							<p className="text-xs font-bold tracking-[0.16em] uppercase opacity-80">Agenda da instituição</p>
							<h2 className="mt-1 text-xl font-extrabold">Eventos desta semana</h2>
						</div>
					</div>
					<span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Atualizado agora</span>
				</div>
			</div>

			<div className="p-5 sm:p-6">
			{eventosPorDia.length === 0 ? (
				<p className="mt-5 text-sm text-texto-suave">Nenhum evento publicado nesta semana.</p>
			) : (
				<div className="mt-5 grid gap-4 sm:grid-cols-2">
					{eventosPorDia.map(({ data, eventos: eventosDoDia }) => (
						<div
							key={chaveDoDia(data)}
							className={`rounded-2xl border border-borda-suave bg-superficie-alt/40 p-4 transition hover:-translate-y-0.5 hover:border-acento/50 ${
								eventosDoDia.length > 2 ? 'flex h-72 min-h-0 flex-col' : ''
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<h3 className="font-bold capitalize text-texto">{nomeDoDia(data)}</h3>
									<p className="mt-1 text-sm capitalize text-texto-suave">{dataDoDia(data)}</p>
								</div>
								<span className="shrink-0 rounded-full bg-acento/10 px-2.5 py-1 text-[11px] font-bold text-acento">
									{descricaoRelativa(data)}
								</span>
							</div>
							<ul
								className={`mt-3 space-y-3 ${
									eventosDoDia.length > 2
										? 'min-h-0 flex-1 touch-pan-y overflow-y-auto pr-2'
										: ''
								}`}
								aria-label={`Eventos de ${nomeDoDia(data)}`}
							>
								{eventosDoDia.map((evento) => (
									<li key={evento.id_evento} className="border-l-4 border-acento pl-3">
										<p className="text-sm font-bold">{evento.titulo}</p>
										<p className="mt-1 text-xs text-texto-suave">
											{horaDoEvento(evento)} · {evento.local}
										</p>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			)}
			<Link href="/calendario" className="mt-6 inline-flex text-sm font-bold text-acento underline-offset-2 transition hover:text-marca hover:underline">
				Ver calendário completo →
			</Link>
			</div>
		</section>
	);
}
