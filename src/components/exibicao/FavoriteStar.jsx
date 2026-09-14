"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import InlineToast from "@/components/ui/InlineToast";

export default function FavoriteStar() {
	const [favoritado, setFavoritado] = useState(false);
	const [mensagem, setMensagem] = useState(null);

	function alternarFavorito() {
		const novoValor = !favoritado;
		setFavoritado(novoValor);
		setMensagem({
			id: Date.now(),
			texto: novoValor
				? "Exibição adicionada aos favoritos"
				: "Exibição removida dos favoritos",
			cor: novoValor ? "bg-green-600" : "bg-red-600",
		});
	}

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={alternarFavorito}
				aria-label={
					favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"
				}
				className="cursor-pointer text-yellow-400 transition-transform duration-300 active:scale-125"
			>
				<Star size={24} fill={favoritado ? "currentColor" : "none"} />
			</button>

			<InlineToast mensagem={mensagem} />
		</div>
	);
}
