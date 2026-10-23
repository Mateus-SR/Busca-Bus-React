import { Cartao } from './ui';

export default function CartaoLogs({ historico, eventosOnibus }) {
	return (
		<Cartao titulo="Logs" className="lg:col-span-2">
			<details>
				<summary className="cursor-pointer">
					Histórico ({historico.length}/30)
				</summary>
				<div className="mt-2 max-h-48 overflow-auto rounded bg-black p-2 text-xs">
					{historico.map((item, indice) => (
						<pre key={`${item.recebidoEm}-${indice}`}>
							{JSON.stringify(item)}
						</pre>
					))}
				</div>
			</details>
			<details className="mt-2">
				<summary className="cursor-pointer">
					Ciclo dos ônibus ({eventosOnibus.length})
				</summary>
				<div className="mt-2 max-h-48 overflow-auto rounded bg-black p-2 text-xs">
					{eventosOnibus.length
						? eventosOnibus.map((evento, indice) => (
								<div
									key={`${evento.em}-${evento.id}-${indice}`}
									className="mb-1"
								>
									{evento.em} · {evento.tipo} · {evento.id}
									{evento.linha ? ` · ${evento.linha}` : ''}
									{evento.previsao ? ` · ${evento.previsao}` : ''}
								</div>
							))
						: 'Nenhum evento registrado.'}
				</div>
			</details>
		</Cartao>
	);
}
