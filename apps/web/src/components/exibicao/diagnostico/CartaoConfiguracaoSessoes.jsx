import { Cartao, Metric } from './ui';

export default function CartaoConfiguracaoSessoes({
	configuracao,
	paradas,
	socket,
}) {
	return (
		<Cartao titulo="Configuração e sessões" className="lg:col-span-2">
			<div className="grid gap-3 lg:grid-cols-3">
				<div className="min-w-0 rounded border border-slate-700 bg-slate-950 p-2">
					<h4 className="mb-2 font-bold">Configuração da exibição</h4>
					<dl className="grid gap-2">
						<Metric
							label="Tolerância atraso"
							value={
								configuracao?.tempoAtraso != null
									? `${configuracao.tempoAtraso} min`
									: null
							}
						/>
						<Metric
							label="Tolerância adiantado"
							value={
								configuracao?.tempoAdiantado != null
									? `${configuracao.tempoAdiantado} min`
									: null
							}
						/>
						<Metric
							label="Distância máxima"
							value={
								configuracao?.distanciaMaxMin != null
									? `${configuracao.distanciaMaxMin} min`
									: null
							}
						/>
					</dl>
				</div>
				<div className="min-w-0 rounded border border-slate-700 bg-slate-950 p-2">
					<h4 className="mb-2 font-bold">Sessão SPTrans</h4>
					<pre className="max-h-72 overflow-auto rounded bg-black p-2 text-xs">
						{JSON.stringify(
							paradas.map((item) => ({
								codigo: item.codigo,
								sptrans: item.sptrans,
							})),
							null,
							2
						)}
					</pre>
				</div>
				<div className="min-w-0 rounded border border-slate-700 bg-slate-950 p-2">
					<h4 className="mb-2 font-bold">Conexão Socket.IO</h4>
					<pre className="max-h-72 overflow-auto rounded bg-black p-2 text-xs">
						{JSON.stringify(socket, null, 2)}
					</pre>
				</div>
			</div>
		</Cartao>
	);
}
