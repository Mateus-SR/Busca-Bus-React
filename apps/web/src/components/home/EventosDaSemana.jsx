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
		day: 'numeric',
		month: 'long',
	});
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
			<section aria-label="Eventos desta semana" className="mt-10 rounded-2xl border border-borda bg-superficie p-5">
				<h2 className="text-xl font-extrabold">Eventos desta semana</h2>
				<p className="mt-2 text-sm text-texto-suave">
					Selecione sua instituição para ver os eventos publicados no calendário.
				</p>
				<Link
					href="/configuracao"
					className="mt-4 inline-flex rounded-xl bg-marca px-4 py-2 text-sm font-bold text-sobre-marca transition hover:bg-marca-forte"
				>
					Escolher instituição
				</Link>
			</section>
		);
	}

	if (erro) {
		return (
			<section aria-label="Eventos desta semana" className="mt-10 rounded-2xl border border-borda p-5">
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
		<section aria-label="Eventos desta semana" className="mt-10 rounded-2xl border border-borda bg-superficie p-5 sm:p-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<CalendarDays className="text-acento" size={22} aria-hidden="true" />
					<h2 className="text-xl font-extrabold">Eventos desta semana</h2>
				</div>
				<Link href="/calendario" className="text-sm font-bold text-acento underline-offset-2 hover:underline">
					Ver calendário completo
				</Link>
			</div>

			{eventosPorDia.length === 0 ? (
				<p className="mt-5 text-sm text-texto-suave">Nenhum evento publicado nesta semana.</p>
			) : (
				<div className="mt-5 grid gap-4 sm:grid-cols-2">
					{eventosPorDia.map(({ data, eventos: eventosDoDia }) => (
						<div key={chaveDoDia(data)} className="rounded-xl border border-borda-suave p-4">
							<h3 className="font-bold capitalize">{nomeDoDia(data)}</h3>
							<ul className="mt-3 space-y-3">
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
		</section>
	);
}
