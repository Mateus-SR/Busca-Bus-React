'use client';

import { useState } from 'react';

// "Forçar atualização" do painel: trava o botão enquanto espera o servidor e traduz a resposta em uma mensagem.
// O estado fica em quem chama (o painel) para sobreviver ao painel ser fechado e reaberto.
export default function useForcarAtualizacao(onAtualizar) {
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
	return { atualizando, retornoAtualizacao, forcarAtualizacao };
}
