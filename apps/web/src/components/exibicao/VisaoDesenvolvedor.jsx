'use client';

import { useEffect, useState } from 'react';

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

// Bloco da faixa de resumo: valor grande, com uma linha de detalhe embaixo.
function Destaque({ rotulo, valor, detalhe, titulo, alerta = false }) {
	return (
		<div
			title={titulo}
			className={`min-w-0 rounded border p-2 ${
				alerta
					? 'border-amber-400 bg-amber-100 text-amber-950'
					: 'bg-gray-50 text-gray-900'
			}`}
		>
			<dt className="text-xs text-gray-600">{rotulo}</dt>
			<dd className="font-roboto-mono text-lg leading-tight font-bold">
				{valor ?? '—'}
			</dd>
			{detalhe && <dd className="truncate text-xs text-gray-600">{detalhe}</dd>}
		</div>
	);
}

// Cada grupo do painel. `aberto` define só o estado inicial; depois quem manda é o clique do usuário.
function Cartao({ titulo, aberto = false, className = '', children }) {
	return (
		<details
			open={aberto}
			className={`rounded-lg border border-slate-700 bg-slate-900 p-3 ${className}`}
		>
			<summary className="cursor-pointer font-bold">{titulo}</summary>
			<div className="mt-3">{children}</div>
		</details>
	);
}

function LinhaFunil({ rotulo, valor, detalhe, destaque = false }) {
	return (
		<div
			className={`flex items-baseline justify-between gap-3 py-1 ${
				destaque ? 'border-t border-slate-600 font-bold' : ''
			}`}
		>
			<span className="min-w-0">
				{rotulo}
				{detalhe && (
					<span className="block text-xs font-normal text-slate-400">
						{detalhe}
					</span>
				)}
			</span>
			<span className="font-roboto-mono text-base">{valor ?? '—'}</span>
		</div>
	);
}

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

function hora(iso) {
	return iso ? new Date(iso).toLocaleTimeString('pt-BR') : null;
}

// Só a hora quando é de hoje; com a data quando a exibição está aberta há dias.
function horaCompleta(iso) {
	if (!iso) return null;
	const data = new Date(iso);
	return data.toDateString() === new Date().toDateString()
		? data.toLocaleTimeString('pt-BR')
		: data.toLocaleString('pt-BR');
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
	const [atualizando, setAtualizando] = useState(false);
	const [retornoAtualizacao, setRetornoAtualizacao] = useState(null);
	async function forcarAtualizacao() {
		setAtualizando(true);
		setRetornoAtualizacao(null);
		try {
			const resposta = await onAtualizar?.();
			setRetornoAtualizacao(
				resposta?.ok
					? resposta.reconectando
						? 'Socket desconectado: reconectando para buscar dados novos.'
						: resposta.ignoradas > 0
							? `Atualização pedida (${resposta.consultadas} parada(s) consultada(s); ${resposta.ignoradas} atualizada(s) há pouco).`
							: null
					: (resposta?.erro ?? 'Falha ao atualizar.')
			);
		} finally {
			setAtualizando(false);
		}
	}
	// Relógio do contador de "Próxima consulta" (o painel só existe aberto, então o tique é barato).
	const [agora, setAgora] = useState(() => Date.now());
	useEffect(() => {
		if (!aberto) return undefined;
		const id = setInterval(() => setAgora(Date.now()), 1000);
		return () => clearInterval(id);
	}, [aberto]);
	async function executarSimulacao(cenario) {
		setRetornoSimulacao('Enviando...');
		const resposta = await onSimular?.(cenario, duracaoSimulacao);
		setRetornoSimulacao(
			resposta?.ok ? null : (resposta?.erro ?? 'Falha ao simular.')
		);
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
	// Quanto falta para a próxima consulta: o restante no instante do snapshot usa só o relógio do servidor
	// (proximaConsultaEm - geradoEm) e o tempo decorrido desde o recebimento usa só o do navegador, então
	// diferença entre os dois relógios não distorce o contador.
	const restantesMs = paradas
		.map(
			(item) => Date.parse(item.proximaConsultaEm) - Date.parse(item.geradoEm)
		)
		.filter(Number.isFinite);
	let proximaConsulta = '—';
	if (frontend?.origem === 'rest') {
		proximaConsulta = 'socket fora do ar';
	} else if (restantesMs.length && frontend?.recebidoEmMs) {
		const faltamMs = Math.min(...restantesMs) - (agora - frontend.recebidoEmMs);
		proximaConsulta =
			emAndamento || faltamMs <= 0
				? 'consultando…'
				: `em ${Math.ceil(faltamMs / 1000)} s`;
	}
	const simulacao = diagnostico?.simulacao;
	const simulacaoAtiva =
		simulacao?.disponivel && simulacao.cenario !== 'normal';
	const ultimaFalha = paradas
		.filter((item) => item.ultimaFalhaEm)
		.sort((a, b) => b.ultimaFalhaEm.localeCompare(a.ultimaFalhaEm))[0];
	const ultimaRecuperacao = paradas
		.map((item) => item.recuperadoEm)
		.filter(Boolean)
		.sort()
		.at(-1);
	const falhasSeguidas = soma('falhasSeguidas');

	// Funil de veículos: o que a SPTrans mandou e o que sobrou na tela, etapa por etapa.
	const brutos = soma('veiculosBrutos');
	const duplicatasUltimaConsulta = Math.max(
		0,
		brutos - soma('veiculosNormalizados')
	);
	const foraDaDistancia = soma('veiculosFiltradosPorDistancia');
	const mesmaLinha = soma('veiculosFiltradosPorLinha');
	const exibidosServidor = soma('veiculosExibidos');
	const exibidos = frontend?.veiculosRenderizados ?? exibidosServidor;
	const multiplosPorLinha = Boolean(parada?.permitirMultiplosPorLinha);
	const ocultos = paradas.flatMap((item) =>
		(item.veiculosOcultos ?? []).map((oculto) => ({
			...oculto,
			ponto: item.codigo,
		}))
	);
	const ocultosTruncados = soma('veiculosOcultosTruncados');

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

	const botaoSecundario =
		'rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600';
	const seletor =
		'rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm';

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
						onClick={forcarAtualizacao}
						disabled={atualizando}
						className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600 disabled:cursor-wait disabled:opacity-60"
					>
						{atualizando ? 'Atualizando...' : 'Forçar atualização'}
					</button>
					<button type="button" onClick={onLimpar} className={botaoSecundario}>
						Limpar (detalhes front)
					</button>
				</div>
			</div>
			{retornoAtualizacao && (
				<p role="status" className="mb-2 text-sm text-amber-300">
					{retornoAtualizacao}
				</p>
			)}
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
				<p className="mb-3 text-sm text-slate-300">
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
					<dl className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
						<Destaque
							rotulo="Estado"
							valor={estadoGeral}
							detalhe={`Próxima consulta: ${proximaConsulta}`}
						/>
						<Destaque
							rotulo="Falhas seguidas"
							valor={falhasSeguidas}
							detalhe={
								falhasSeguidas > 0
									? (ultimaFalha?.ultimoErro ?? 'falha sem mensagem')
									: 'nenhuma falha no momento'
							}
							titulo={ultimaFalha?.ultimoErro ?? undefined}
							alerta={falhasSeguidas > 0}
						/>
						<Destaque
							rotulo="Veículos"
							valor={`${brutos} → ${exibidos}`}
							detalhe={`recebidos → exibidos · ${Math.max(0, brutos - exibidos)} ocultos`}
						/>
						<Destaque
							rotulo="Sala"
							valor={`${socket?.usuariosNaSala ?? '—'} usuário(s)`}
							detalhe={`${socket?.snapshotsEnviados ?? '—'} snapshots · ${formatarBytes(socket?.snapshotBytesAtual ?? frontend?.snapshotBytesAtual, unidadeSnapshot) ?? '—'} / ${formatarBytes(socket?.snapshotBytesTotal ?? frontend?.snapshotBytesTotal, unidadeSnapshot) ?? '—'}`}
							titulo={
								socket?.metricasDesde
									? `Métricas da sala desde ${hora(socket.metricasDesde)}`
									: undefined
							}
						/>
					</dl>
				</>
			)}

			<div className="grid items-start gap-3 lg:grid-cols-2">
				{diagnostico && (
					<>
						<Cartao titulo="Testes" className="lg:col-span-2">
							<label className="mb-3 flex items-start gap-2 rounded border border-slate-700 bg-slate-950 p-2 text-sm">
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
										Altera globalmente para essa sala, compartilhado com todos
										os usuários.
									</span>
								</span>
							</label>
							{simulacao?.disponivel ? (
								<div className="flex flex-wrap items-center gap-2">
									<select
										value={cenarioSimulado}
										onChange={(evento) =>
											setCenarioSimulado(evento.target.value)
										}
										aria-label="Cenário de falha a simular"
										className={seletor}
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
										className={seletor}
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
										className={botaoSecundario}
									>
										Derrubar socket
									</button>
								</div>
							) : (
								<p className="text-xs text-slate-400">
									Simulação de falhas indisponível neste servidor.
								</p>
							)}
							{retornoSimulacao && (
								<p role="status" className="mt-2 text-sm text-amber-300">
									{retornoSimulacao}
								</p>
							)}
						</Cartao>

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
													{paradas.length > 1 && (
														<th className="pr-2">Ponto</th>
													)}
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

						<Cartao titulo="Coleta SPTrans" aberto>
							<dl className="grid grid-cols-2 gap-2">
								<Metric label="Consultas (total)" value={soma('consultas')} />
								<Metric
									label="Latência máxima (ms)"
									value={maior('ultimaDuracaoMs')}
								/>
								<Metric
									label="Falhas acumuladas (total)"
									value={soma('falhas')}
								/>
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
									<summary className="cursor-pointer">
										Métricas por ponto
									</summary>
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
						</Cartao>

						<Cartao titulo="Socket e sala">
							<dl className="grid grid-cols-2 gap-2">
								<Metric
									label="Socket conectado"
									value={socket ? 'sim' : 'não'}
								/>
								<Metric label="Salas ativas" value={socket?.salasAtivas} />
								<Metric
									label="Inscrições nas paradas (todas as salas)"
									value={`${soma('referenciasAtivas')} (${maior('referenciasAtivas') ?? 0}x${paradas.length})`}
									className="col-span-1"
								/>
								<div className="col-span-1 rounded border bg-gray-50 p-2 text-gray-900">
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
							</dl>
						</Cartao>
					</>
				)}

				<Cartao titulo="Conexão do navegador">
					<dl className="grid grid-cols-2 gap-2">
						<Metric
							label="Exibição iniciada"
							value={horaCompleta(socket?.salaIniciadaEm)}
						/>
						<Metric label="Reconexões / Desconexões" value={conexao?.reconexoes + " / " + conexao?.desconexoes}/>
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

				{diagnostico && (
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
				)}

				{diagnostico && (
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
				)}
			</div>
		</aside>
	);
}
