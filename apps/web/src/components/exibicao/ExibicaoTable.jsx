"use client";

import { useMemo, useState } from "react";
import StatusBadge from "@/components/exibicao/StatusBadge";
import FiltroOrdenacao from "@/components/exibicao/FiltroOrdenacao";
import { minutosAteChegar } from "@busca-bus/core";

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
				return minutosAteChegar(a.previsao) - minutosAteChegar(b.previsao);
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

			<table className="mx-auto min-w-[40rem] table-auto border-collapse text-sm sm:min-w-full sm:text-base lg:text-3xl">
				<thead>
					<tr className="bg-gray-100 font-extrabold">
						<th className="px-3 py-3 text-center sm:px-6">Código</th>
						<th className="px-3 py-3 text-center sm:px-6">Nome</th>
						<th className="px-3 py-3 text-center sm:px-6">Previsão</th>
						<th className="px-3 py-3 text-center sm:px-6">Status</th>
					</tr>
				</thead>
				<tbody>
					{linhasExibidas.map((item) => (
						<tr
							key={item.id}
							className="animate-fadeIn border-b hover:bg-gray-50"
						>
							<td className="px-3 py-3 text-center font-extrabold sm:px-6">
								{item.codigoLetreiro}
							</td>
							<td className="px-3 py-3 text-center sm:px-6">{item.sentidoLinha}</td>
							<td className="px-3 py-3 text-center sm:px-6">{item.previsao}</td>
							<td className="px-3 py-3 text-center sm:px-6">
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
