'use client';

import { useEffect, useState } from 'react';

// Tudo o que o painel deriva do diagnóstico recebido: totais por parada, estado geral, contagem para a próxima
// consulta, funil de veículos e anomalias. Devolve null com o painel fechado.
export default function useResumoDiagnostico({ aberto, diagnostico, conexao }) {
	// Relógio do contador de "Próxima consulta" (o painel só existe aberto, então o tique é barato).
	const [agora, setAgora] = useState(() => Date.now());
	useEffect(() => {
		if (!aberto) return undefined;
		const id = setInterval(() => setAgora(Date.now()), 1000);
		return () => clearInterval(id);
	}, [aberto]);
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
	return {
		paradas,
		parada,
		frontend,
		socket,
		soma,
		maior,
		estadoGeral,
		proximaConsulta,
		simulacao,
		simulacaoAtiva,
		ultimaFalha,
		ultimaRecuperacao,
		falhasSeguidas,
		brutos,
		duplicatasUltimaConsulta,
		foraDaDistancia,
		mesmaLinha,
		exibidosServidor,
		exibidos,
		multiplosPorLinha,
		ocultos,
		ocultosTruncados,
		anomalias,
	};
}
