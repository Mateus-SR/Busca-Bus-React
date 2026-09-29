"use client";

import { useMemo, useState } from "react";
import StatusBadge from "@/components/exibicao/StatusBadge";
import FiltroOrdenacao from "@/components/exibicao/FiltroOrdenacao";

export default function ExibicaoTable({ onibus }) {
	const [busca, setBusca] = useState("");
	const [ordenacao, setOrdenacao] = useState("padrao");

	const linhasExibidas = useMemo(() => {
		const buscaLower = busca.toLowerCase();

		const filtradas = buscaLower
			? onibus.filter((item) =>
					[item.codigoLetreiro, item.sentidoLinha, item.previsao, item.status]
						.join(" ")
						.toLowerCase()
						.includes(buscaLower)
				)
			: onibus;

		if (ordenacao === "padrao") return filtradas;

		const ordenadas = [...filtradas].sort((a, b) => {
			if (ordenacao === "nome") {
				return a.sentidoLinha.localeCompare(b.sentidoLinha);
			}
			if (ordenacao === "tempo") {
				return a.previsao.localeCompare(b.previsao);
			}
			return 0;
		});

		return ordenadas;
	}, [onibus, busca, ordenacao]);

	return (
		<div>
			<FiltroOrdenacao
				busca={busca}
				aoMudarBusca={setBusca}
				ordenacao={ordenacao}
				aoMudarOrdenacao={setOrdenacao}
			/>

			<table className="mx-auto min-w-full table-auto border-collapse lg:text-3xl">
				<thead>
					<tr className="bg-gray-100 font-extrabold">
						<th className="px-6 py-3 text-center">Código</th>
						<th className="px-6 py-3 text-center">Nome</th>
						<th className="px-6 py-3 text-center">Previsão</th>
						<th className="px-6 py-3 text-center">Status</th>
					</tr>
				</thead>
				<tbody>
					{linhasExibidas.map((item) => (
						<tr
							key={item.id}
							className="animate-fadeIn border-b hover:bg-gray-50"
						>
							<td className="px-6 py-3 text-center font-extrabold">
								{item.codigoLetreiro}
							</td>
							<td className="px-6 py-3 text-center">{item.sentidoLinha}</td>
							<td className="px-6 py-3 text-center">{item.previsao}</td>
							<td className="px-6 py-3 text-center">
								<StatusBadge status={item.status} />
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{linhasExibidas.length === 0 && (
				<p className="py-6 text-center text-gray-500">
					Nenhum ônibus encontrado para essa busca.
				</p>
			)}
		</div>
	);
}
