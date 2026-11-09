'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, X } from 'lucide-react';
import { CORES_EVENTO, dataPorExtenso, horaCurta } from '@/utils/calendario';

export default function EventoPopup({
	evento,
	onClose,
	ehAdministrador = false,
	onExcluirEvento,
}) {
	const dialogoRef = useRef(null);
	const confirmacaoRef = useRef(null);
	const botaoFecharRef = useRef(null);
	const botaoCancelarExclusaoRef = useRef(null);
	const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);
	const [excluindo, setExcluindo] = useState(false);
	const [erroExclusao, setErroExclusao] = useState('');

	useEffect(() => {
		setConfirmacaoAberta(false);
		setErroExclusao('');
	}, [evento]);

	useEffect(() => {
		if (!evento) return;
		if (confirmacaoAberta) botaoCancelarExclusaoRef.current?.focus();
		else botaoFecharRef.current?.focus();
	}, [evento, confirmacaoAberta]);

	useEffect(() => {
		if (!evento) return;

		const aoApertarTecla = (e) => {
			if (e.key === 'Escape') {
				if (confirmacaoAberta && !excluindo) setConfirmacaoAberta(false);
				else if (!confirmacaoAberta) onClose();
			}
			if (e.key === 'Tab') {
				const dialogo = confirmacaoAberta
					? confirmacaoRef.current
					: dialogoRef.current;
				const focaveis = dialogo?.querySelectorAll(
					'a[href], button:not([disabled])'
				);
				if (!focaveis?.length) return;

				const primeiro = focaveis[0];
				const ultimo = focaveis[focaveis.length - 1];
				if (e.shiftKey && document.activeElement === primeiro) {
					e.preventDefault();
					ultimo.focus();
				} else if (!e.shiftKey && document.activeElement === ultimo) {
					e.preventDefault();
					primeiro.focus();
				}
			}
		};
		document.addEventListener('keydown', aoApertarTecla);

		const larguraDaBarra =
			window.innerWidth - document.documentElement.clientWidth;
		const { overflow: overflowAnterior, paddingRight: paddingAnterior } =
			document.body.style;
		document.body.style.overflow = 'hidden';
		if (larguraDaBarra > 0)
			document.body.style.paddingRight = `${larguraDaBarra}px`;

		return () => {
			document.removeEventListener('keydown', aoApertarTecla);
			document.body.style.overflow = overflowAnterior;
			document.body.style.paddingRight = paddingAnterior;
		};
	}, [evento, onClose, confirmacaoAberta, excluindo]);

	const confirmarExclusao = async () => {
		setExcluindo(true);
		setErroExclusao('');
		try {
			await onExcluirEvento(evento.id_evento);
			setConfirmacaoAberta(false);
			onClose();
		} catch (erro) {
			setErroExclusao(erro.message);
		} finally {
			setExcluindo(false);
		}
	};

	if (!evento) return null;

	return (
		<div
			className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/30 px-4 py-6"
			onClick={onClose}
			role="presentation"
		>
			<div
				ref={dialogoRef}
				className="font-inter relative w-full max-w-sm rounded-2xl bg-gray-200 p-5 text-black shadow-xl"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="evento-popup-titulo"
			>
				<button
					ref={botaoFecharRef}
					type="button"
					onClick={onClose}
					aria-label="Fechar detalhes do evento"
					className="absolute top-3 right-3 cursor-pointer rounded-full p-1 transition hover:bg-black/10"
				>
					<X size={22} />
				</button>

				<div className="flex items-start gap-2.5 pr-8">
					<span
						aria-hidden="true"
						className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-sm ${CORES_EVENTO[evento.cor]}`}
					/>
					<h2
						id="evento-popup-titulo"
						className="text-xl leading-tight font-medium"
					>
						<span className="block uppercase">{evento.tipo}</span>
						<span className="block">{evento.titulo}</span>
					</h2>
				</div>

				<p className="mt-3 text-sm">{dataPorExtenso(evento.inicio)}</p>
				<p className="text-sm text-gray-700">
					{horaCurta(evento.inicio)} às {horaCurta(evento.fim)} · {evento.local}
				</p>

				<h3 className="mt-4 text-xs font-bold">Descrição:</h3>
				<p className="mt-1 text-sm leading-relaxed text-gray-800">
					{evento.descricao}
				</p>

				{ehAdministrador && (
					<div className="mt-5 flex flex-wrap gap-2">
						<Link
							href={`/calendario/novo?editar=${encodeURIComponent(evento.id_evento)}`}
							className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-100"
						>
							<Pencil size={16} aria-hidden="true" />
							Editar evento
						</Link>
						<button
							type="button"
							onClick={() => setConfirmacaoAberta(true)}
							className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-800"
						>
							<Trash2 size={16} aria-hidden="true" />
							Excluir evento
						</button>
					</div>
				)}

				{confirmacaoAberta && (
					<div
						className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/50 px-4 py-6"
						role="presentation"
						onClick={() => !excluindo && setConfirmacaoAberta(false)}
					>
						<section
							ref={confirmacaoRef}
							role="alertdialog"
							aria-modal="true"
							aria-labelledby="confirmar-exclusao-titulo"
							aria-describedby="confirmar-exclusao-descricao"
							className="font-inter w-full max-w-sm rounded-2xl bg-white p-6 text-black shadow-xl"
							onClick={(e) => e.stopPropagation()}
						>
							<h2 id="confirmar-exclusao-titulo" className="text-lg font-bold">
								Excluir evento?
							</h2>
							<p id="confirmar-exclusao-descricao" className="mt-2 text-sm text-gray-700">
								Tem certeza de que deseja excluir “{evento.titulo}”? Esta ação não pode ser desfeita.
							</p>
							{erroExclusao && (
								<p role="alert" className="mt-3 text-sm font-semibold text-red-700">
									{erroExclusao}
								</p>
							)}
							<div className="mt-5 flex justify-end gap-2">
								<button
									ref={botaoCancelarExclusaoRef}
									type="button"
									onClick={() => setConfirmacaoAberta(false)}
									disabled={excluindo}
									className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
								>
									Cancelar
								</button>
								<button
									type="button"
									onClick={confirmarExclusao}
									disabled={excluindo}
									className="cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{excluindo ? 'Excluindo...' : 'Excluir'}
								</button>
							</div>
						</section>
					</div>
				)}
			</div>
		</div>
	);
}
