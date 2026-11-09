'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { ehAdmin } from '@busca-bus/core';
import { useAuth } from '@/contexts/AuthContext';
import { listarEventos, listarFatecs } from '@/lib/eventosApi';
import CalendarioView from './CalendarioView';

export default function CalendarioComEventos() {
	const { usuario, carregando } = useAuth();
	const [eventos, setEventos] = useState(null);
	const [fatecs, setFatecs] = useState([]);
	const [erro, setErro] = useState('');

	const carregar = useCallback(async () => {
		try {
			const [listaEventos, listaFatecs] = await Promise.all([
				listarEventos(),
				listarFatecs().catch(() => []),
			]);
			setEventos(listaEventos);
			setFatecs(listaFatecs);
		} catch (e) {
			setErro(e.message);
		}
	}, []);

	useEffect(() => {
		carregar();
	}, [carregar]);

	const tentarDeNovo = () => {
		setErro('');
		setEventos(null);
		carregar();
	};

	if (erro) {
		return (
			<div role="alert" className="border-borda mt-6 rounded-xl border p-6 text-center">
				<p className="text-erro font-semibold">{erro}</p>
				<button
					type="button"
					onClick={tentarDeNovo}
					className="mt-4 cursor-pointer rounded-xl border-2 border-gray-300 px-4 py-2 text-sm font-bold transition hover:bg-gray-100"
				>
					Tentar de novo
				</button>
			</div>
		);
	}

	if (!eventos || carregando) {
		return <div className="mt-6 h-96 animate-pulse rounded bg-gray-100" aria-hidden="true" />;
	}

	const fatec =
		fatecs.find((item) => item.id_fac === usuario?.fac_id) ??
		fatecs.find((item) => /zona leste/i.test(item.nome_fac));
	const eventosDaFatec = fatec ? eventos.filter((evento) => evento.fac_id === fatec.id_fac) : eventos;

	return (
		<>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="text-sptrans text-sm font-black tracking-[0.18em] uppercase">
					{fatec ? fatec.nome_fac : 'Eventos das Fatecs'}
				</div>

				{ehAdmin(usuario?.role) && (
					<Link
						href="/calendario/novo"
						className="bg-destaque text-sobre-destaque hover:bg-destaque-forte inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition"
					>
						<Plus size={18} strokeWidth={3} aria-hidden="true" />
						Novo evento
					</Link>
				)}
			</div>

			<CalendarioView eventos={eventosDaFatec} />
		</>
	);
}