import { Cartao, LinhaFunil } from './ui';

const ROTULOS_MOTIVO = {
	linha: 'mesma linha',
	distancia: 'fora da distância',
	duplicata: 'duplicata',
};

const CORES_MOTIVO = {
	linha: 'bg-sky-900 text-sky-100',
	distancia: 'bg-slate-700 text-slate-100',
	duplicata: 'bg-amber-900 text-amber-100',
};

function descreverMotivo(item) {
	if (item.motivo === 'linha') {
		const substituto = item.substituto;
		return substituto
			? `ficou o ${substituto.veiculo}${substituto.previsao ? ` (${substituto.previsao})` : ''}`
			: '';
	}
	if (item.motivo === 'distancia') {
		return item.minutos != null ? `${item.minutos} min` : 'sem previsão válida';
	}
	return 'mesmo veículo repetido na resposta';
}

export default function CartaoVeiculos({ resumo }) {
	const {
		paradas,
		parada,
		soma,
		brutos,
		duplicatasUltimaConsulta,
		foraDaDistancia,
		mesmaLinha,
		multiplosPorLinha,
		exibidos,
		exibidosServidor,
		ocultos,
		ocultosTruncados,
	} = resumo;
	return (
		<Cartao titulo="Veículos" aberto>
			<div className="text-sm">
				<LinhaFunil rotulo="Recebidos da SPTrans" valor={brutos} />
				<LinhaFunil
					rotulo="− Duplicatas"
					valor={duplicatasUltimaConsulta}
					detalhe={`${soma('duplicatasDescartadas')} acumuladas desde que o servidor subiu`}
				/>
				<LinhaFunil
					rotulo="− Fora da distância"
					valor={foraDaDistancia}
					detalhe={`limite de ${parada?.distanciaMaxMin ?? '—'} min`}
				/>
				<LinhaFunil
					rotulo="− Mesma linha"
					valor={mesmaLinha}
					detalhe={
						multiplosPorLinha
							? 'desligado: "vários ônibus por linha" está ativo'
							: 'já havia outro ônibus da linha na lista'
					}
				/>
				<LinhaFunil
					rotulo="= Exibidos"
					valor={exibidos}
					destaque
					detalhe={
						exibidos !== exibidosServidor
							? `o servidor enviou ${exibidosServidor}`
							: undefined
					}
				/>
			</div>
			<details className="mt-3">
				<summary className="cursor-pointer">
					Veículos ocultos ({ocultos.length + ocultosTruncados})
				</summary>
				{ocultos.length ? (
					<div className="mt-2 max-h-64 overflow-auto rounded bg-black p-2 text-xs">
						<table className="w-full text-left">
							<thead className="text-slate-400">
								<tr>
									{paradas.length > 1 && <th className="pr-2">Ponto</th>}
									<th className="pr-2">Veículo</th>
									<th className="pr-2">Linha</th>
									<th className="pr-2">Previsão</th>
									<th>Motivo</th>
								</tr>
							</thead>
							<tbody>
								{ocultos.map((item, indice) => (
									<tr
										key={`${item.ponto}-${item.motivo}-${item.veiculo}-${indice}`}
										className="align-top"
									>
										{paradas.length > 1 && (
											<td className="pr-2">{item.ponto}</td>
										)}
										<td className="pr-2">{item.veiculo}</td>
										<td className="pr-2">{item.linha}</td>
										<td className="pr-2">{item.previsao ?? '—'}</td>
										<td>
											<span
												className={`mr-1 rounded px-1 ${CORES_MOTIVO[item.motivo] ?? ''}`}
											>
												{ROTULOS_MOTIVO[item.motivo] ?? item.motivo}
											</span>
											{descreverMotivo(item)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{ocultosTruncados > 0 && (
							<p className="mt-2 text-slate-400">
								+ {ocultosTruncados} não listados (limite da lista).
							</p>
						)}
					</div>
				) : (
					<p className="mt-2 text-xs text-slate-400">
						Nenhum veículo oculto neste momento.
					</p>
				)}
			</details>
		</Cartao>
	);
}
