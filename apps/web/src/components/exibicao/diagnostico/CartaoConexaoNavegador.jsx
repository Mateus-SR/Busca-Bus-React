import { hora, horaCompleta } from './formatadores';
import { Cartao, Metric } from './ui';

export default function CartaoConexaoNavegador({
	conexao,
	socket,
	frontend,
	eventosConexao,
}) {
	return (
		<Cartao titulo="Conexão do navegador">
			<dl className="grid grid-cols-2 gap-2">
				<Metric
					label="Exibição iniciada"
					value={horaCompleta(socket?.salaIniciadaEm)}
				/>
				<Metric
					label="Reconexões / Desconexões"
					value={conexao?.reconexoes + ' / ' + conexao?.desconexoes}
				/>
				<Metric
					label="Última queda"
					value={hora(conexao?.ultimaDesconexaoEm)}
				/>
				<Metric
					label="Última reconexão"
					value={hora(conexao?.ultimaReconexaoEm)}
				/>
				<Metric
					label="Fallback REST"
					value={conexao?.fallbackRest ? 'ativo' : 'inativo'}
				/>
				<Metric
					label="Respostas descartadas"
					value={frontend?.respostasDescartadas}
				/>
			</dl>
			<details className="mt-3">
				<summary className="cursor-pointer">
					Eventos de conexão ({eventosConexao.length})
				</summary>
				<div className="mt-2 max-h-48 overflow-auto rounded bg-black p-2 text-xs">
					{eventosConexao.length
						? eventosConexao.map((evento, indice) => (
								<div key={`${evento.em}-${indice}`} className="mb-1">
									{hora(evento.em)} · {evento.tipo}
									{evento.detalhe ? ` · ${evento.detalhe}` : ''}
								</div>
							))
						: 'Nenhum evento registrado.'}
				</div>
			</details>
		</Cartao>
	);
}
