'use client';

import { useState } from 'react';

// Controles da simulação de falhas do painel: cenário, duração e a mensagem de retorno do último pedido.
// O estado fica em quem chama (o painel) para sobreviver ao painel ser fechado e reaberto.
export default function useSimulacaoDiagnostico(onSimular) {
	const [cenarioSimulado, setCenarioSimulado] = useState('rede');
	const [duracaoSimulacao, setDuracaoSimulacao] = useState(60);
	const [retornoSimulacao, setRetornoSimulacao] = useState(null);
	async function executarSimulacao(cenario) {
		setRetornoSimulacao('Enviando...');
		const resposta = await onSimular?.(cenario, duracaoSimulacao);
		setRetornoSimulacao(
			resposta?.ok ? null : (resposta?.erro ?? 'Falha ao simular.')
		);
	}
	return {
		cenarioSimulado,
		setCenarioSimulado,
		duracaoSimulacao,
		setDuracaoSimulacao,
		retornoSimulacao,
		executarSimulacao,
	};
}
