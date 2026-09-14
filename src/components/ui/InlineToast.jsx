"use client";

import { useEffect, useState } from "react";

const DURACAO_MS = 1800;

export default function InlineToast({ mensagem }) {
	const [visivel, setVisivel] = useState(false);

	useEffect(() => {
		if (!mensagem) return;

		setVisivel(true);
		const timeout = setTimeout(() => setVisivel(false), DURACAO_MS);
		return () => clearTimeout(timeout);
	}, [mensagem?.id]);

	if (!mensagem) return null;

	return (
		<div
			className={`ml-2 rounded-lg px-3 py-1 text-sm font-semibold text-white shadow-lg transition-opacity duration-300 ${mensagem.cor} ${
				visivel ? "opacity-100" : "pointer-events-none opacity-0"
			}`}
		>
			{mensagem.texto}
		</div>
	);
}
