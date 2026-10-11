'use client';

import { useState } from 'react';

function Metric({ label, value }) {
	return (
		<div className="rounded border bg-gray-50 p-2 text-gray-900">
			<dt className="text-xs text-gray-600">{label}</dt>
			<dd className="font-roboto-mono text-sm font-bold text-gray-950">
				{value ?? '—'}
			</dd>
		</div>
	);
}

const UNIDADES_BYTES = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };

function formatarBytes(valor, unidade = 'auto') {
	if (valor == null) return null;
	if (unidade === 'auto') {
		if (valor < 1024) return `${valor} B`;
		return `${(valor / 1024).toFixed(1)} KB`;
	}
	const casas = unidade === 'GB' ? 6 : unidade === 'MB' ? 3 : 1;
	return `${(valor / UNIDADES_BYTES[unidade]).toFixed(casas)} ${unidade}`;
}

export default function VisaoDesenvolvedor({
	aberto,
	diagnostico,
	historico = [],
	eventosOnibus = [],
	configuracao,
	permitirMultiplosPorLinha,
	onPermitirMultiplosPorLinha,
	diagnosticoSocketAtivo,
	onDiagnosticoSocket,
	onLimpar,
	onAtualizar,
}) {
	const [unidadeSnapshot, setUnidadeSnapshot] = useState('auto');
	if (!aberto) return null;
	const paradas = diagnostico?.paradas ?? [];
	const parada = paradas[0];
	const frontend = diagnostico?.frontend;
	const socket = diagnostico?.socket;
	const soma = (campo) =>
		paradas.reduce((total, item) => total + (Number(item?.[campo]) || 0), 0);
	const maior = (campo) =>
		paradas.reduce(
			(valor, item) => Math.max(valor, Number(item?.[campo]) || 0),
			0
		) || null;
	const estadoGeral = paradas.some(
		(item) => item.estadoConexao === 'reconectando'
	)
		? 'reconectando'
		: paradas.some((item) => item.estadoConexao === 'conectado')
			? 'conectado'
			: parada?.estadoConexao;
	const emAndamento = paradas.some((item) => item.consultaEmAndamento);
	const anomalias = [
		parada?.duplicatasDescartadas > 0 &&
			`${parada.duplicatasDescartadas} duplicata(s) descartada(s)`,
		parada?.falhas > 0 && `${parada.falhas} falha(s) de consulta`,
		parada?.ultimaDuracaoMs > 3000 && 'latência acima de 3 segundos',
		frontend?.respostasDescartadas > 0 &&
			`${frontend.respostasDescartadas} resposta(s) fora de ordem`,
	].filter(Boolean);

	return (
		<aside
			className="my-4 rounded-xl border-2 border-slate-700 bg-slate-950 p-4 text-slate-100 shadow-lg"
			aria-label="Visão desenvolvedor"
		>
			<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
				<h2 className="font-roboto-mono text-base font-bold">
					Detalhes técnicos
				</h2>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={onAtualizar}
						className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
					>
						Forçar atualização
					</button>
					<button
						type="button"
						onClick={onLimpar}
						className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
					>
						Limpar
					</button>
				</div>
			</div>
			<div className="flex flex-row gap-2">
				<label className="mb-3 flex flex-1 items-start gap-2 rounded border border-slate-700 bg-slate-900 p-2 text-sm">
					<input
						type="checkbox"
						checked={permitirMultiplosPorLinha}
						onChange={(evento) =>
							onPermitirMultiplosPorLinha(evento.target.checked)
						}
						className="mt-1"
					/>
					<span>
						<strong>Testar vários ônibus da mesma linha</strong>
						<br />
						<span className="text-xs text-slate-400">
							Altera globalmente para essa sala, compartilhado com todos os
							usuários.
						</span>
					</span>
				</label>
				<label className="mb-3 flex flex-1 items-start gap-2 rounded border border-slate-700 bg-slate-900 p-2 text-sm">
					<input
						type="checkbox"
						checked={diagnosticoSocketAtivo}
						onChange={(evento) => onDiagnosticoSocket(evento.target.checked)}
						className="mt-1"
					/>
					<span>
						<strong>Enviar diagnóstico entre sessões Socket.IO</strong>
						<br />
						<span className="text-xs text-slate-400">
							Sincronizado entre todos os navegadores desta exibição. Desligue
							para não enviar o diagnóstico pelo socket.
						</span>
					</span>
				</label>
			</div>
			{!diagnostico ? (
				<p className="text-sm text-slate-300">
					Aguardando diagnóstico do próximo snapshot...
				</p>
			) : (
				<>
					{anomalias.length > 0 && (
						<div
							role="alert"
							className="mb-3 rounded border border-amber-400 bg-amber-950/50 p-2 text-sm text-amber-200"
						>
							Anomalias: {anomalias.join(' · ')}
						</div>
					)}
					<details open className="mb-2">
						<summary className="cursor-pointer font-bold">
							Resumo da coleta
						</summary>
						<dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
							<Metric
								label="Consultas (todos os pontos)"
								value={soma('consultas')}
							/>
							<Metric label="Falhas (todos os pontos)" value={soma('falhas')} />
							<Metric
								label="Latência máxima (ms)"
								value={maior('ultimaDuracaoMs')}
							/>
							<Metric
								label="Veículos recebidos"
								value={soma('veiculosNormalizados')}
							/>
							<Metric
								label="Filtrados por distância"
								value={soma('veiculosFiltradosPorDistancia')}
							/>
							<Metric
								label="Duplicatas descartadas"
								value={soma('duplicatasDescartadas')}
							/>
							<Metric
								label="Referências ativas (usuários x pontos de parada)"
								value={`${soma('referenciasAtivas')} (${maior('referenciasAtivas') ?? 0}x${paradas.length})`}
							/>
							<Metric label="Estado geral" value={estadoGeral} />
							<Metric
								label="Em andamento"
								value={emAndamento ? 'sim' : 'não'}
							/>
							<Metric
								label="Respostas descartadas"
								value={frontend?.respostasDescartadas}
							/>
							<Metric
								label="Veículos exibidos"
								value={frontend?.veiculosRenderizados}
							/>
							<div className="rounded border bg-gray-50 p-2 text-gray-900">
								<dt className="flex items-center justify-between gap-1 text-xs text-gray-600">
									Snapshot atual / total (sala)
									<select
										value={unidadeSnapshot}
										onChange={(evento) =>
											setUnidadeSnapshot(evento.target.value)
										}
										aria-label="Unidade do tamanho do snapshot"
										className="rounded border bg-white px-1 text-xs text-gray-900"
									>
										<option value="auto">Auto</option>
										<option value="KB">KB</option>
										<option value="MB">MB</option>
										<option value="GB">GB</option>
									</select>
								</dt>
								<dd className="font-roboto-mono text-sm font-bold text-gray-950">{`${formatarBytes(socket?.snapshotBytesAtual ?? frontend?.snapshotBytesAtual, unidadeSnapshot) ?? '—'} / ${formatarBytes(socket?.snapshotBytesTotal ?? frontend?.snapshotBytesTotal, unidadeSnapshot) ?? '—'}`}</dd>
							</div>
							<Metric label="Socket conectado" value={socket ? 'sim' : 'não'} />
							<Metric
								label="Usuários conectados"
								value={socket?.clientesConectados}
							/>
							<Metric label="Salas ativas" value={socket?.salasAtivas} />
							<Metric
								label="Snapshots enviados"
								value={socket?.snapshotsEnviados}
							/>
						</dl>
						{paradas.length > 1 && (
							<details className="mt-3">
								<summary className="cursor-pointer font-bold">
									Métricas por ponto
								</summary>
								<div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
									{paradas.map((item) => (
										<div
											key={item.codigo}
											className="min-w-0 rounded border border-slate-700 bg-slate-900 p-2"
										>
											<div className="mb-2 text-xs font-bold text-slate-300">
												Ponto {item.codigo}
											</div>
											<dl className="grid grid-cols-2 gap-2 xl:grid-cols-4">
												<Metric label="Estado" value={item.estadoConexao} />
												<Metric label="Consultas" value={item.consultas} />
												<Metric label="Falhas" value={item.falhas} />
												<Metric
													label="Latência (ms)"
													value={item.ultimaDuracaoMs}
												/>
												<Metric
													label="Veículos"
													value={item.veiculosNormalizados}
												/>
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
					</details>
					<details>
						<summary className="cursor-pointer font-bold">
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
						<summary className="cursor-pointer font-bold">
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
					<details className="mt-3">
						<summary className="cursor-pointer font-bold">
							Conexões e Configurações
						</summary>
						<div className="grid gap-3 lg:grid-cols-3">
							<div className="min-w-0 rounded border border-slate-700 bg-slate-900 p-2">
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
							<div className="min-w-0 rounded border border-slate-700 bg-slate-900 p-2">
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
							<div className="min-w-0 rounded border border-slate-700 bg-slate-900 p-2">
								<h4 className="mb-2 font-bold">Conexão Socket.IO</h4>
								<pre className="max-h-72 overflow-auto rounded bg-black p-2 text-xs">
									{JSON.stringify(socket, null, 2)}
								</pre>
							</div>
						</div>
					</details>
				</>
			)}
		</aside>
	);
}
