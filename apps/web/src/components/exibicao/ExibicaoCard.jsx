import StatusBadge from "@/components/exibicao/StatusBadge";

// Visão em card de um ônibus, usada abaixo de `lg` no lugar da tabela.
// Componente só de apresentação: recebe o item já normalizado pelo radar e não toca no socket.
//
// Cuidado com o alto contraste (globals.css): ele força fundo preto em todo `div` e texto em `span`/`p`/`li`.
// Por isso o fundo vive num `div` (o `li` fica transparente) e todo texto fica em `span`/`p`.
export default function ExibicaoCard({ item, detalhesTecnicos = false }) {
	return (
		<li className="animate-fadeIn">
			<div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
				<div className="flex w-1/3 shrink-0 flex-col items-center justify-center gap-1 border-r border-gray-200 bg-gray-100 p-3 text-center">
					<span className="text-2xl leading-none font-extrabold">
						<span className="sr-only">Linha </span>
						{item.codigoLetreiro}
					</span>
					<span className="font-roboto-mono text-xl font-bold text-gray-700">
						<span className="sr-only">Previsão </span>
						{item.previsao}
					</span>
				</div>

				<div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3">
					<span className="text-lg leading-tight font-extrabold break-words uppercase">
						<span className="sr-only">Sentido </span>
						{item.sentidoLinha}
					</span>
					<span>
						<StatusBadge status={item.status} />
					</span>

					{detalhesTecnicos && (
						<div className="flex flex-col gap-0.5 border-t border-gray-200 pt-2 text-xs text-gray-500">
							<p className="truncate font-roboto-mono" title={item.id}>
								<span className="font-semibold">ID</span> {item.id}
							</p>
							<p>
								<span className="font-semibold">Promessa</span>{" "}
								{item.promessa ?? "—"}
							</p>
							<p className="font-roboto-mono">
								<span className="font-sans font-semibold">Posição</span>{" "}
								{item.posicao
									? `${item.posicao.lat.toFixed(5)}, ${item.posicao.lng.toFixed(5)}`
									: "—"}
							</p>
							<p className="font-roboto-mono">
								<span className="font-sans font-semibold">Atualizado</span>{" "}
								{item.atualizadoEm
									? new Date(item.atualizadoEm).toLocaleTimeString("pt-BR")
									: "—"}
							</p>
						</div>
					)}
				</div>
			</div>
		</li>
	);
}
