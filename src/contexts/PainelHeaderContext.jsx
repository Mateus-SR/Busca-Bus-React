"use client";

import { createContext, useContext, useState } from "react";

const PainelHeaderContext = createContext(null);

export function PainelHeaderProvider({ children }) {
	const [headerOculto, setHeaderOculto] = useState(false);
	const [conteudoExtra, setConteudoExtra] = useState(null);

	return (
		<PainelHeaderContext.Provider
			value={{ headerOculto, setHeaderOculto, conteudoExtra, setConteudoExtra }}
		>
			{children}
		</PainelHeaderContext.Provider>
	);
}

export function usePainelHeader() {
	const contexto = useContext(PainelHeaderContext);
	if (!contexto) {
		throw new Error(
			"usePainelHeader deve ser usado dentro de um PainelHeaderProvider",
		);
	}
	return contexto;
}
