'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const MOSTRAR_BUSCA_A_PARTIR_DE = 8;

const simplificar = (texto) =>
	String(texto ?? '')
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase();

export default function SeletorFatec({
	fatecs,
	selecionadaId,
	onEscolher,
}) {
	const [aberto, setAberto] = useState(false);
	const [busca, setBusca] = useState('');
	const raizRef = useRef(null);
	const botaoRef = useRef(null);
	const painelRef = useRef(null);
	const idPainel = useId();

	const selecionada = fatecs.find((fatec) => fatec.id_fac === selecionadaId);
	const comBusca = fatecs.length >= MOSTRAR_BUSCA_A_PARTIR_DE;

	const visiveis = useMemo(() => {
		const termo = simplificar(busca).trim();
		if (!termo) return fatecs;
		return fatecs.filter((fatec) =>
			simplificar(`${fatec.nome_fac} ${fatec.sigla ?? ''} ${fatec.municipio ?? ''}`).includes(termo)
		);
	}, [fatecs, busca]);

	const fechar = (devolverFoco = true) => {
		setAberto(false);
		setBusca('');
		if (devolverFoco) botaoRef.current?.focus();
	};

	useEffect(() => {
		if (!aberto) return;
		const atual = painelRef.current?.querySelector('[aria-current="true"]');
		(atual ?? painelRef.current?.querySelector('[data-opcao]'))?.focus();
	}, [aberto]);

	useEffect(() => {
		if (!aberto) return;
		const aoClicar = (e) => {
			if (!raizRef.current?.contains(e.target)) fechar(false);
		};
		document.addEventListener('pointerdown', aoClicar);
		return () => document.removeEventListener('pointerdown', aoClicar);
	}, [aberto]);

	const escolher = (id) => {
		onEscolher(id);
		fechar();
	};

	const aoTeclar = (e) => {
		if (e.key === 'Escape') {
			e.preventDefault();
			fechar();
			return;
		}
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;

		const opcoes = [...painelRef.current.querySelectorAll('[data-opcao]')];
		if (opcoes.length === 0) return;
		e.preventDefault();

		const indice = opcoes.indexOf(document.activeElement);
		let proximo;
		if (e.key === 'Home') proximo = 0;
		else if (e.key === 'End') proximo = opcoes.length - 1;
		else if (e.key === 'ArrowDown') proximo = Math.min(indice + 1, opcoes.length - 1);
		else proximo = indice <= 0 ? -1 : indice - 1; // -1 = volta para a caixa de busca
		if (proximo === -1) painelRef.current.querySelector('input')?.focus();
		else opcoes[proximo].focus();
	};

	return (
		<div
			ref={raizRef}
			className="relative min-w-0"
			onBlur={(e) => {
				if (aberto && !raizRef.current?.contains(e.relatedTarget)) fechar(false);
			}}
		>
			<button
				ref={botaoRef}
				type="button"
				onClick={() => (aberto ? fechar(false) : setAberto(true))}
				aria-expanded={aberto}
				aria-controls={idPainel}
				aria-label={`Fatec: ${selecionada?.nome_fac ?? ''}. Escolher outra Fatec`}
				className="-mx-2 flex max-w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
			>
				<span className="text-sptrans text-sm font-black tracking-[0.18em] uppercase">
					{selecionada?.nome_fac}
				</span>
				<ChevronDown
					size={20}
					strokeWidth={3}
					aria-hidden="true"
					className={`text-sptrans shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`}
				/>
			</button>

			{aberto && (
				<div
					id={idPainel}
					ref={painelRef}
					onKeyDown={aoTeclar}
					className="absolute top-full left-0 z-30 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-gray-400 bg-white p-1.5 shadow-xl"
				>
					{comBusca && (
						<input
							type="search"
							value={busca}
							onChange={(e) => setBusca(e.target.value)}
							placeholder="Buscar Fatec"
							aria-label="Buscar Fatec"
							className="mb-1.5 w-full rounded-lg border border-gray-400 px-3 py-2 text-base focus:outline-2 focus:outline-offset-1 focus:outline-black"
						/>
					)}

					{visiveis.length === 0 ? (
						<p role="status" className="p-3 text-sm text-gray-600">
							Nenhuma Fatec encontrada.
						</p>
					) : (
						<ul className="max-h-72 overflow-y-auto">
							{visiveis.map((fatec) => {
								const atual = fatec.id_fac === selecionadaId;
								return (
									<li key={fatec.id_fac}>
										<button
											type="button"
											data-opcao
											aria-current={atual ? 'true' : undefined}
											onClick={() => escolher(fatec.id_fac)}
											className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black ${
												atual ? 'font-bold' : ''
											}`}
										>
											<span className="min-w-0 flex-1">
												<span className="block wrap-break-word">{fatec.nome_fac}</span>
												{fatec.municipio && (
													<span className="block text-xs font-normal text-gray-600">
														{fatec.municipio}
													</span>
												)}
											</span>
											{atual && <Check size={18} strokeWidth={3} aria-hidden="true" className="text-sptrans shrink-0" />}
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}