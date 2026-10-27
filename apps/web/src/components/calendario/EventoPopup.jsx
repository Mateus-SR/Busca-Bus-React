'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { CORES_EVENTO, dataPorExtenso, horaCurta } from '@/utils/calendario';

export default function EventoPopup({ evento, onClose }) {
	const botaoFecharRef = useRef(null);

	useEffect(() => {
		if (evento) botaoFecharRef.current?.focus();
	}, [evento]);

	useEffect(() => {
		if (!evento) return;

		const aoApertarTecla = (e) => {
			if (e.key === 'Escape') onClose();
			if (e.key === 'Tab') e.preventDefault();
		};
		document.addEventListener('keydown', aoApertarTecla);

		const overflowAnterior = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.removeEventListener('keydown', aoApertarTecla);
			document.body.style.overflow = overflowAnterior;
		};
	}, [evento, onClose]);

	if (!evento) return null;

	return (
		<div
			className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/30 px-4 py-6"
			onClick={onClose}
			role="presentation"
		>
			<div
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
			</div>
		</div>
	);
}
