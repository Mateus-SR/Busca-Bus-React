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
			className={`fixed top-16 left-1/2 z-[1100] min-w-max -translate-x-1/2 rounded-lg px-4 py-2 text-center text-sm font-semibold text-white shadow-lg transition-opacity duration-300 ${mensagem.cor} ${
				visivel ? "opacity-100" : "pointer-events-none opacity-0"
			}`}
		>
			{mensagem.texto}
		</div>
	);
}
