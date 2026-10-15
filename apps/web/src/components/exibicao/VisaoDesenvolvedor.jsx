'use client';

import { useState } from 'react';

function Metric({ label, value, className = '' }) {
	return (
		<div className={`rounded border bg-gray-50 p-2 text-gray-900 ${className}`}>
			<dt className="text-xs text-gray-600">{label}</dt>
			<dd className="font-roboto-mono text-sm font-bold text-gray-950">
				{value ?? '—'}
			</dd>
		</div>
	);
}

function hora(iso) {
	return iso ? new Date(iso).toLocaleTimeString('pt-BR') : null;
}

const DURACOES_SIMULACAO = [
	{ segundos: 30, rotulo: '30 s' },
	{ segundos: 60, rotulo: '1 min' },
	{ segundos: 120, rotulo: '2 min' },
	{ segundos: 300, rotulo: '5 min' },
];

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
	onLimpar,
	onAtualizar,
	conexao,
	eventosConexao = [],
	onSimular,
}) {
	const [unidadeSnapshot, setUnidadeSnapshot] = useState('auto');
	const [cenarioSimulado, setCenarioSimulado] = useState('rede');
	const [duracaoSimulacao, setDuracaoSimulacao] = useState(60);
	const [retornoSimulacao, setRetornoSimulacao] = useState(null);
	async function executarSimulacao(cenario) {
		setRetornoSimulacao('Enviando...');
		const resposta = await onSimular?.(cenario, duracaoSimulacao);
		setRetornoSimulacao(resposta?.ok ? null : (resposta?.erro ?? 'Falha ao simular.'));
	}
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
	const simulacao = diagnostico?.simulacao;
	const simulacaoAtiva = simulacao?.disponivel && simulacao.cenario !== 'normal';
	const ultimaFalha = paradas
		.filter((item) => item.ultimaFalhaEm)
		.sort((a, b) => b.ultimaFalhaEm.localeCompare(a.ultimaFalhaEm))[0];
	const ultimaRecuperacao = paradas
		.map((item) => item.recuperadoEm)
		.filter(Boolean)
		.sort()
		.at(-1);
	const falhasSeguidas = soma('falhasSeguidas');
	const anomalias = [
		parada?.duplicatasDescartadas > 0 &&
			`${parada.duplicatasDescartadas} duplicata(s) descartada(s)`,
		falhasSeguidas > 0 &&
			`${falhasSeguidas} falha(s) seguida(s) de consulta${ultimaFalha?.ultimoErro ? ` (${ultimaFalha.ultimoErro})` : ''}`,
		conexao?.fallbackRest && 'socket indisponível: usando o fallback REST',
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
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={onAtualizar}
						className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
					>
						Forçar atualização
					</button>
					{simulacao?.disponivel && (
						<>
							<select
								value={cenarioSimulado}
								onChange={(evento) => setCenarioSimulado(evento.target.value)}
								aria-label="Cenário de falha a simular"
								className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm"
							>
								{simulacao.cenarios
									.filter((item) => item.id !== 'normal')
									.map((item) => (
										<option key={item.id} value={item.id}>
											{item.rotulo}
										</option>
									))}
							</select>
							<select
								value={duracaoSimulacao}
								onChange={(evento) =>
									setDuracaoSimulacao(Number(evento.target.value))
								}
								aria-label="Duração da simulação"
								className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm"
							>
								{DURACOES_SIMULACAO.map((item) => (
									<option key={item.segundos} value={item.segundos}>
										{item.rotulo}
									</option>
								))}
							</select>
							<button
								type="button"
								onClick={() => executarSimulacao(cenarioSimulado)}
								className="rounded bg-amber-700 px-3 py-1 text-sm hover:bg-amber-600"
							>
								Simular
							</button>
							<button
								type="button"
								onClick={() => executarSimulacao('queda_socket')}
								title="Fecha só a conexão deste navegador; ele reconecta sozinho"
								className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
							>
								Derrubar socket
							</button>
						</>
					)}
					<button
						type="button"
						onClick={onLimpar}
						className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
					>
						Limpar
					</button>
				</div>
			</div>
			{retornoSimulacao && (
				<p role="status" className="mb-2 text-sm text-amber-300">
					{retornoSimulacao}
				</p>
			)}
			{simulacaoAtiva && (
				<div
					role="alert"
					className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded border border-red-400 bg-red-950/50 p-2 text-sm text-red-200"
				>
					<span>
						Simulação ativa: <strong>{simulacao.rotulo}</strong> (afeta todas as
						salas deste servidor) · até {hora(simulacao.expiraEm)}
					</span>
					<button
						type="button"
						onClick={() => executarSimulacao('normal')}
						className="rounded bg-red-800 px-3 py-1 hover:bg-red-700"
					>
						Encerrar simulação
					</button>
				</div>
			)}
			<details open className="mb-3">
				<summary className="cursor-pointer font-bold">
					Conexão do navegador
				</summary>
				<dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
					<Metric label="Reconexões" value={conexao?.reconexoes} />
					<Metric label="Desconexões" value={conexao?.desconexoes} />
					<Metric label="Última queda" value={hora(conexao?.ultimaDesconexaoEm)} />
					<Metric
						label="Última reconexão"
						value={hora(conexao?.ultimaReconexaoEm)}
					/>
					<Metric
						label="Fallback REST"
						value={conexao?.fallbackRest ? 'ativo' : 'inativo'}
					/>
				</dl>
				<details className="mt-2">
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
			</details>
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
								label="Consultas (total)"
								value={soma('consultas')}
							/>
							<Metric
								label="Falhas acumuladas (total) / Falhas seguidas"
								value={soma('falhas') + " / " + falhasSeguidas}
							/>
							<Metric label="Última falha / Última recuperação" value={(hora(ultimaFalha?.ultimaFalhaEm) || "-") + " / " + (hora(ultimaRecuperacao) || "-")} />

							<Metric
								label="Latência máxima (ms)"
								value={maior('ultimaDuracaoMs')}
							/>
							
							<Metric
								label="Último erro"
								value={ultimaFalha?.ultimoErro}
								className="col-span-2 sm:col-span-3"
							/>

							<div className="col-span-3 grid grid-cols-3 gap-2 sm:col-span-1">
								<Metric
									className="flex flex-row-reverse *:flex-col items-center justify-center gap-1.5"
									label="Veículos recebidos"
									value={soma('veiculosNormalizados')}
								/>
								<Metric
									className="flex flex-row-reverse *:flex-col items-center justify-center gap-1.5"
									label="Veículos exibidos"
									value={frontend?.veiculosRenderizados}
								/>
								<Metric
									className="flex flex-row-reverse *:flex-col items-center justify-center gap-1.5"
									label="Filtrados por distância"
									value={soma('veiculosFiltradosPorDistancia')}
								/>
							</div>
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
								label={`Snapshots enviados (sala${socket?.metricasDesde ? `, desde ${hora(socket.metricasDesde)}` : ''})`}
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
												<Metric label="Falhas / Falhas seguidas" value={item.falhas + " / " + item.falhasSeguidas} />
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
