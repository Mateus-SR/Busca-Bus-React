"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ZoomControls from "@/components/ui/ZoomControls";
import { usePainelHeader } from "@/contexts/PainelHeaderContext";

function formatarNumero(valor) {
	return valor < 10 ? `0${valor}` : `${valor}`;
}

export default function RelogioZoomPanel() {
	const { setConteudoExtra, setHeaderOculto } = usePainelHeader();

	useEffect(() => {
		setConteudoExtra(<RelogioAba />);

		return () => setConteudoExtra(null);
	}, [setConteudoExtra]);

	useEffect(() => {
		return () => setHeaderOculto(false);
	}, [setHeaderOculto]);

	return null;
}

function RelogioAba() {
	const { headerOculto, setHeaderOculto } = usePainelHeader();
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

	return (
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
		</section>
	);
}
