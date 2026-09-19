"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, ZoomIn, ZoomOut } from "lucide-react";

const NIVEIS_ZOOM = [50, 67, 75, 90, 100, 110, 125, 133, 150];
const NIVEL_PADRAO = 4;

export default function ZoomControls() {
	const [zoomAtual, setZoomAtual] = useState(NIVEL_PADRAO);
	const [popup, setPopup] = useState(null);

	useEffect(() => {
		return () => {
			document.documentElement.style.fontSize = "";
		};
	}, []);

	function aplicarZoom(novoIndice, tipo) {
		setZoomAtual(novoIndice);
		document.documentElement.style.fontSize = `${NIVEIS_ZOOM[novoIndice]}%`;
		setPopup({ id: Date.now(), tipo, valor: NIVEIS_ZOOM[novoIndice] });
	}

	const podeDiminuir = zoomAtual > 0;
	const podeAumentar = zoomAtual < NIVEIS_ZOOM.length - 1;

	return (
		<>
			<div className="flex flex-row text-center text-gray-900">
				<button
					type="button"
					onClick={() => podeDiminuir && aplicarZoom(zoomAtual - 1, "minus")}
					disabled={!podeDiminuir}
					aria-label="Diminuir zoom"
					className="cursor-pointer rounded-bl-[14px] border-2 border-gray-400 bg-gray-100 px-[15px] py-3 text-[10px] shadow-xl transition-all duration-300 ease-out hover:bg-gray-400 hover:text-sptrans disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Minus size={14} />
				</button>
				<button
					type="button"
					onClick={() => podeAumentar && aplicarZoom(zoomAtual + 1, "plus")}
					disabled={!podeAumentar}
					aria-label="Aumentar zoom"
					className="cursor-pointer rounded-br-[14px] border-2 border-gray-400 bg-gray-100 px-[15px] py-3 text-[10px] shadow-xl transition-all duration-300 ease-out hover:bg-gray-400 hover:text-sptrans disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Plus size={14} />
				</button>
			</div>

			{popup && (
				<div
					key={popup.id}
					onAnimationEnd={() => setPopup(null)}
					className="fixed top-4 left-1/2 z-[1000] mt-[32px] -translate-x-1/2 animate-fadeOutHold rounded-2xl border-2 border-gray-400 bg-white px-[14px] py-[10px] text-center font-roboto-mono text-3xl font-bold text-sptrans shadow-xl"
				>
					{popup.tipo === "plus" ? (
						<ZoomIn className="inline align-middle" />
					) : (
						<ZoomOut className="inline align-middle" />
					)}
					<span className="ml-2 align-middle">{popup.valor}%</span>
				</div>
			)}
		</>
	);
}
