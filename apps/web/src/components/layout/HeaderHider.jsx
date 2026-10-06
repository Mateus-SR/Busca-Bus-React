"use client";

import { useEffect, useRef, useState } from "react";
import { usePainelHeader } from "@/contexts/PainelHeaderContext";

export default function HeaderHider({ header }) {
	const { headerOculto, conteudoExtra } = usePainelHeader();
	const headerRef = useRef(null);
	const [alturaHeader, setAlturaHeader] = useState(0);

	useEffect(() => {
		const elemento = headerRef.current;
		if (!elemento) return;

		const atualizarAltura = () => setAlturaHeader(elemento.offsetHeight);
		atualizarAltura();

		const observer = new ResizeObserver(atualizarAltura);
		observer.observe(elemento);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={headerRef}
			style={{
				marginBottom: headerOculto ? -alturaHeader : 0,
				transform: headerOculto ? "translateY(-100%)" : "translateY(0)",
				transition: "transform 500ms ease-in-out, margin-bottom 500ms ease-in-out",
			}}
			className="z-50"
		>
			{header}
			{conteudoExtra}
		</div>
	);
}
