"use client";

import { usePainelHeader } from "@/contexts/PainelHeaderContext";

export default function HeaderHider({ header }) {
	const { headerOculto, conteudoExtra } = usePainelHeader();

	return (
		<div
			className={`z-50 transition-transform duration-700 ease-in-out ${
				headerOculto ? "-translate-y-full" : ""
			}`}
		>
			{header}
			{conteudoExtra}
		</div>
	);
}
