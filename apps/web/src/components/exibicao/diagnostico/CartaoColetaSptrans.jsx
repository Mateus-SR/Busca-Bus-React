import { hora } from './formatadores';
import { Cartao, Metric } from './ui';

export default function CartaoColetaSptrans({ resumo }) {
	const { paradas, soma, maior, ultimaFalha, ultimaRecuperacao } = resumo;
	return (
		<Cartao titulo="Coleta SPTrans" aberto>
			<dl className="grid grid-cols-2 gap-2">
				<Metric label="Consultas (total)" value={soma('consultas')} />
				<Metric label="Latência máxima (ms)" value={maior('ultimaDuracaoMs')} />
				<Metric label="Falhas acumuladas (total)" value={soma('falhas')} />
				<Metric
					label="Última falha / Última recuperação"
					value={
						hora(ultimaFalha?.ultimaFalhaEm) ||
						'-' + ' / ' + (hora(ultimaRecuperacao) || '-')
					}
				/>
				<Metric
					label="Último erro"
					value={ultimaFalha?.ultimoErro}
					className="col-span-2"
				/>
			</dl>
			{paradas.length > 1 && (
				<details className="mt-3">
					<summary className="cursor-pointer">Métricas por ponto</summary>
					<div className="mt-2 grid grid-cols-1 gap-2">
						{paradas.map((item) => (
							<div
								key={item.codigo}
								className="min-w-0 rounded border border-slate-700 bg-slate-950 p-2"
							>
								<div className="mb-2 text-xs font-bold text-slate-300">
									Ponto {item.codigo}
								</div>
								<dl className="grid grid-cols-2 gap-2 xl:grid-cols-4">
									<Metric label="Estado" value={item.estadoConexao} />
									<Metric label="Consultas" value={item.consultas} />
									<Metric
										label="Falhas / Falhas seguidas"
										value={`${item.falhas} / ${item.falhasSeguidas}`}
									/>
									<Metric label="Latência (ms)" value={item.ultimaDuracaoMs} />
									<Metric label="Veículos" value={item.veiculosNormalizados} />
									<Metric
										label="Duplicatas"
										value={item.duplicatasDescartadas}
									/>
									<Metric
										label="Sessão ativa"
										value={item.sptrans?.sessaoAtiva ? 'sim' : 'não'}
									/>
									<Metric
										label="Autenticações"
										value={item.sptrans?.autenticacoes}
									/>
								</dl>
							</div>
						))}
					</div>
				</details>
			)}
		</Cartao>
	);
}
