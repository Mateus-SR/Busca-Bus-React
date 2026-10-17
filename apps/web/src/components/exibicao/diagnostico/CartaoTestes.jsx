import OpcaoMultiplosPorLinha from './OpcaoMultiplosPorLinha';
import { botaoSecundario, Cartao, seletor } from './ui';

const DURACOES_SIMULACAO = [
	{ segundos: 30, rotulo: '30 s' },
	{ segundos: 60, rotulo: '1 min' },
	{ segundos: 120, rotulo: '2 min' },
	{ segundos: 300, rotulo: '5 min' },
];

export default function CartaoTestes({
	simulacao,
	controle,
	permitirMultiplosPorLinha,
	onPermitirMultiplosPorLinha,
}) {
	const {
		cenarioSimulado,
		setCenarioSimulado,
		duracaoSimulacao,
		setDuracaoSimulacao,
		retornoSimulacao,
		executarSimulacao,
	} = controle;
	return (
		<Cartao titulo="Testes" className="lg:col-span-2">
			<OpcaoMultiplosPorLinha
				marcado={permitirMultiplosPorLinha}
				aoAlterar={onPermitirMultiplosPorLinha}
				className="mb-3 flex items-start gap-2 rounded border border-slate-700 bg-slate-950 p-2 text-sm"
			/>
			{simulacao?.disponivel ? (
				<div className="flex flex-wrap items-center gap-2">
					<select
						value={cenarioSimulado}
						onChange={(evento) => setCenarioSimulado(evento.target.value)}
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
	);
}
