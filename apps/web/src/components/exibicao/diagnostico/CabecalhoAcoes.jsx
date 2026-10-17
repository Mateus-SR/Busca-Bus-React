import { hora } from './formatadores';
import { botaoSecundario } from './ui';

// Título, botões Forçar atualização / Limpar, mensagens de retorno e o aviso de simulação ativa.
export default function CabecalhoAcoes({
	atualizando,
	forcarAtualizacao,
	onLimpar,
	retornoAtualizacao,
	retornoSimulacao,
	simulacao,
	simulacaoAtiva,
	executarSimulacao,
}) {
	return (
		<>
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
		</>
	);
}
