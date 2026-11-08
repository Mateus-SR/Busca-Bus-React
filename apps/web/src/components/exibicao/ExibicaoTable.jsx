"use client";

import { useMemo, useState } from "react";
import StatusBadge from "@/components/exibicao/StatusBadge";
import ExibicaoCard from "@/components/exibicao/ExibicaoCard";
import FiltroOrdenacao from "@/components/exibicao/FiltroOrdenacao";
import { minutosAteChegar } from "@busca-bus/core";

export default function ExibicaoTable({ onibus, detalhesTecnicos = false }) {
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

			{/* Abaixo de lg: cards, sem rolagem horizontal. Mesma lista filtrada/ordenada da tabela. */}
			<ul className="flex flex-col gap-3 lg:hidden">
				{linhasExibidas.map((item) => (
					<ExibicaoCard
						key={item.id}
						item={item}
						detalhesTecnicos={detalhesTecnicos}
					/>
				))}
			</ul>

			<table className="mx-auto hidden min-w-full table-auto border-collapse lg:table lg:text-3xl">
				<thead>
					<tr className="bg-superficie-alt font-extrabold">
						{detalhesTecnicos && <th className="hidden px-2 py-3 text-center text-xs sm:table-cell sm:px-3 sm:text-sm lg:text-base">ID</th>}
						<th className="px-3 py-3 text-center sm:px-6">Código</th>
						<th className="px-3 py-3 text-center sm:px-6">Nome</th>
						<th className="px-3 py-3 text-center sm:px-6">Previsão</th>
						<th className="px-3 py-3 text-center sm:px-6">Status</th>
						{detalhesTecnicos && <th className="hidden px-2 py-3 text-center text-xs lg:table-cell lg:px-3 lg:text-base">Posição</th>}
						{detalhesTecnicos && <th className="hidden px-2 py-3 text-center text-xs xl:table-cell xl:px-3 xl:text-base">Atualizado</th>}
					</tr>
				</thead>
				<tbody>
					{linhasExibidas.map((item) => (
						<tr
							key={item.id}
							className="animate-fadeIn border-b hover:bg-superficie-sutil"
						>
							{detalhesTecnicos && <td className="hidden max-w-32 truncate px-2 py-3 text-center font-roboto-mono text-xs sm:table-cell sm:px-3 lg:text-sm" title={item.id}>
								{item.id}
							</td>}
							<td className="px-3 py-3 text-center font-extrabold sm:px-6">
								{item.codigoLetreiro}
							</td>
							<td className="px-3 py-3 text-center sm:px-6">{item.sentidoLinha}</td>
							<td className="px-3 py-3 text-center sm:px-6">
								<div>{item.previsao}</div>
								{detalhesTecnicos && <div className="text-xs font-normal text-texto-mudo">Promessa: {item.promessa ?? "—"}</div>}
							</td>
							<td className="px-3 py-3 text-center sm:px-6">
								<StatusBadge status={item.status} />
							</td>
							{detalhesTecnicos && <td className="hidden px-2 py-3 text-center font-roboto-mono text-xs lg:table-cell lg:px-3 lg:text-sm">
								{item.posicao ? `${item.posicao.lat.toFixed(5)}, ${item.posicao.lng.toFixed(5)}` : "—"}
							</td>}
							{detalhesTecnicos && <td className="hidden px-2 py-3 text-center font-roboto-mono text-xs xl:table-cell xl:px-3 lg:text-sm">
								{item.atualizadoEm ? new Date(item.atualizadoEm).toLocaleTimeString("pt-BR") : "—"}
							</td>}
						</tr>
					))}
				</tbody>
			</table>

			{linhasExibidas.length === 0 && (
				<p className="py-6 text-center text-texto-mudo">
					Nenhum ônibus encontrado para essa busca.
				</p>
			)}
		</div>
	);
}
