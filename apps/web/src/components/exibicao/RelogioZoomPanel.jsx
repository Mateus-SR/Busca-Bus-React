"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ZoomControls from "@/components/ui/ZoomControls";
import { usePainelHeader } from "@/contexts/PainelHeaderContext";

function formatarNumero(valor) {
	return valor < 10 ? `0${valor}` : `${valor}`;
}

export default function RelogioZoomPanel() {
	const { headerOculto, setHeaderOculto, setConteudoExtra } = usePainelHeader();
	const [hora, setHora] = useState("--:--:--");

	useEffect(() => {
		function atualizarRelogio() {
			const agora = new Date();
			setHora(
				`${formatarNumero(agora.getHours())}:${formatarNumero(agora.getMinutes())}:${formatarNumero(agora.getSeconds())}`,
			);
		}

		atualizarRelogio();
		const intervalo = setInterval(atualizarRelogio, 1000);
		return () => clearInterval(intervalo);
	}, []);

	// Registra o conteúdo no slot do HeaderChrome: assim ele fica dentro do
	// mesmo wrapper que sobe (-translate-y-full) junto com o Header. Como aqui
	// é `absolute` (fora do fluxo), a altura do wrapper é só a do Header — a
	// distância que ele sobe é exatamente a altura do Header, então esta aba,
	// posicionada logo abaixo dele, permanece parada na tela.
	useEffect(() => {
		setConteudoExtra(
			<section className="absolute z-40 hidden flex-col items-start lg:flex">
				<button
					type="button"
					onClick={() => setHeaderOculto((v) => !v)}
					aria-label={headerOculto ? "Mostrar cabeçalho" : "Esconder cabeçalho"}
					className="flex h-24 w-96 cursor-pointer items-center justify-center rounded-br-3xl bg-sptrans font-roboto-mono font-extrabold text-white shadow-xl"
				>
					{headerOculto ? (
						<ChevronDown className="mr-2.5 text-white/85" size={28} />
					) : (
						<ChevronUp className="mr-2.5 text-white/85" size={28} />
					)}
					<p className="text-6xl">{hora}</p>
				</button>

				<ZoomControls />
			</section>,
		);

		return () => setConteudoExtra(null);
	}, [headerOculto, hora, setConteudoExtra, setHeaderOculto]);

	return null;
}
