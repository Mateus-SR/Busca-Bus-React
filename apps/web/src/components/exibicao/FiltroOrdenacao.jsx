"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FiltroOrdenacao({
	busca,
	aoMudarBusca,
	ordenacao,
	aoMudarOrdenacao,
	controleEsquerdo = null,
}) {
	const [menuAberto, setMenuAberto] = useState(false);
	const menuRef = useRef(null);

	useEffect(() => {
		if (!menuAberto) return;

		function fecharMenu(evento) {
			if (!menuRef.current?.contains(evento.target)) {
				setMenuAberto(false);
			}
		}

		function fecharComEsc(evento) {
			if (evento.key === "Escape") {
				setMenuAberto(false);
			}
		}

		document.addEventListener("pointerdown", fecharMenu);
		document.addEventListener("keydown", fecharComEsc);

		return () => {
			document.removeEventListener("pointerdown", fecharMenu);
			document.removeEventListener("keydown", fecharComEsc);
		};
	}, [menuAberto]);

	return (
		<div className="relative z-10 mb-4 flex w-full min-w-0 flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center sm:gap-3">
			{controleEsquerdo}
			<input
				type="text"
				value={busca}
				onChange={(e) => aoMudarBusca(e.target.value)}
				placeholder="Pesquisar linha"
				className="min-w-0 w-full flex-1 rounded-full border border-borda px-4 py-3 text-center text-base focus:ring-2 focus:ring-acento focus:outline-none sm:py-2 sm:text-left"
			/>

			<div ref={menuRef} className="relative w-fit shrink-0 self-center">
				<button
					type="button"
					onClick={() => setMenuAberto((aberto) => !aberto)}
					aria-expanded={menuAberto}
					className="flex cursor-pointer items-center gap-2 rounded-full border border-borda bg-superficie px-4 py-2 text-base font-bold text-texto-suave transition hover:bg-superficie-alt"
				>
					{ordenacao === "tempo" ? "Horário" : "Nome (A-Z)"}

					<ChevronDown
						size={16}
						className={`transition-transform ${menuAberto ? "rotate-180" : ""}`}
					/>
				</button>

				{menuAberto && (
					<div className="absolute top-full right-0 z-50 mt-2 min-w-max overflow-hidden rounded-xl border border-borda bg-superficie shadow-lg">
						<button
							type="button"
							onClick={() => {
								aoMudarOrdenacao("tempo");
								setMenuAberto(false);
							}}
							className={`block w-full cursor-pointer px-4 py-2 text-left text-base transition hover:bg-superficie-alt ${ordenacao === "tempo" ? "font-bold text-acento" : "text-texto"
								}`}
						>
							Horário
						</button>

						<button
							type="button"
							onClick={() => {
								aoMudarOrdenacao("nome");
								setMenuAberto(false);
							}}
							className={`block w-full cursor-pointer px-4 py-2 text-left text-base transition hover:bg-superficie-alt ${ordenacao === "nome" ? "font-bold text-acento" : "text-texto"
								}`}
						>
							Nome (A-Z)
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
