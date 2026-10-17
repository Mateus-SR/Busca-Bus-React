'use client';

import { useState } from 'react';
import useForcarAtualizacao from '@/hooks/useForcarAtualizacao';
import useResumoDiagnostico from '@/hooks/useResumoDiagnostico';
import useSimulacaoDiagnostico from '@/hooks/useSimulacaoDiagnostico';
import CabecalhoAcoes from './diagnostico/CabecalhoAcoes';
import CartaoColetaSptrans from './diagnostico/CartaoColetaSptrans';
import CartaoConexaoNavegador from './diagnostico/CartaoConexaoNavegador';
import CartaoConfiguracaoSessoes from './diagnostico/CartaoConfiguracaoSessoes';
import CartaoLogs from './diagnostico/CartaoLogs';
import CartaoSocketSala from './diagnostico/CartaoSocketSala';
import CartaoTestes from './diagnostico/CartaoTestes';
import CartaoVeiculos from './diagnostico/CartaoVeiculos';
import FaixaResumo from './diagnostico/FaixaResumo';
import OpcaoMultiplosPorLinha from './diagnostico/OpcaoMultiplosPorLinha';

// Painel "Detalhes técnicos". Este arquivo só monta o layout: o estado e os dados derivados ficam nos hooks
// (e não nos blocos) para sobreviverem ao painel ser fechado e reaberto; cada bloco visual está em ./diagnostico.
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
	const { atualizando, retornoAtualizacao, forcarAtualizacao } =
		useForcarAtualizacao(onAtualizar);
	const simulacaoControle = useSimulacaoDiagnostico(onSimular);
	const resumo = useResumoDiagnostico({ aberto, diagnostico, conexao });
	if (!resumo) return null;
	const { paradas, frontend, socket, simulacao, simulacaoAtiva } = resumo;

	return (
		<aside
			className="my-4 rounded-xl border-2 border-slate-700 bg-slate-950 p-4 text-slate-100 shadow-lg"
			aria-label="Visão desenvolvedor"
		>
			<CabecalhoAcoes
				atualizando={atualizando}
				forcarAtualizacao={forcarAtualizacao}
				onLimpar={onLimpar}
				retornoAtualizacao={retornoAtualizacao}
				retornoSimulacao={simulacaoControle.retornoSimulacao}
				simulacao={simulacao}
				simulacaoAtiva={simulacaoAtiva}
				executarSimulacao={simulacaoControle.executarSimulacao}
			/>
			<div className="flex flex-row gap-2">
				<OpcaoMultiplosPorLinha
					marcado={permitirMultiplosPorLinha}
					aoAlterar={onPermitirMultiplosPorLinha}
					className="mb-3 flex flex-1 items-start gap-2 rounded border border-slate-700 bg-slate-900 p-2 text-sm"
				/>
			</div>
			<FaixaResumo
				diagnostico={diagnostico}
				resumo={resumo}
				unidadeSnapshot={unidadeSnapshot}
			/>

			<div className="grid items-start gap-3 lg:grid-cols-2">
				{diagnostico && (
					<>
						<CartaoTestes
							simulacao={simulacao}
							controle={simulacaoControle}
							permitirMultiplosPorLinha={permitirMultiplosPorLinha}
							onPermitirMultiplosPorLinha={onPermitirMultiplosPorLinha}
						/>
						<CartaoVeiculos resumo={resumo} />
						<CartaoColetaSptrans resumo={resumo} />
						<CartaoSocketSala
							resumo={resumo}
							unidadeSnapshot={unidadeSnapshot}
							setUnidadeSnapshot={setUnidadeSnapshot}
						/>
					</>
				)}

				<CartaoConexaoNavegador
					conexao={conexao}
					socket={socket}
					frontend={frontend}
					eventosConexao={eventosConexao}
				/>

				{diagnostico && (
					<CartaoLogs historico={historico} eventosOnibus={eventosOnibus} />
				)}

				{diagnostico && (
					<CartaoConfiguracaoSessoes
						configuracao={configuracao}
						paradas={paradas}
						socket={socket}
					/>
				)}
			</div>
		</aside>
	);
}
