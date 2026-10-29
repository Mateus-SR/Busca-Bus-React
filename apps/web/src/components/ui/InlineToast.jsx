"use client";

import { useEffect, useState } from "react";

const DURACAO_MS = 1800;

export default function InlineToast({ mensagem }) {
	const [visivel, setVisivel] = useState(true);

	useEffect(() => {
		if (!mensagem) return;

		const timeout = setTimeout(() => setVisivel(false), DURACAO_MS);
		return () => clearTimeout(timeout);
	}, [mensagem]);

	if (!mensagem) return null;

	return (
		<div
			role="status"
			aria-live="polite"
			className={`fixed top-4 right-4 z-[2200] w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-800 shadow-xl transition-opacity duration-300 sm:top-5 sm:right-5 ${
				visivel ? "opacity-100" : "pointer-events-none opacity-0"
			}`}
		>
			{mensagem.texto}
		</div>
	);
}
