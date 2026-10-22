import { formatarBytes, hora } from './formatadores';
import { Destaque } from './ui';

// Faixa do topo: anomalias e os quatro destaques (estado, falhas seguidas, veículos e sala).
export default function FaixaResumo({ diagnostico, resumo, unidadeSnapshot }) {
	const {
		anomalias,
		estadoGeral,
		proximaConsulta,
		falhasSeguidas,
		ultimaFalha,
		brutos,
		exibidos,
		socket,
		frontend,
	} = resumo;
	if (!diagnostico) {
		return (
			<p className="mb-3 text-sm text-slate-300">
				Aguardando diagnóstico do próximo snapshot...
			</p>
		);
	}
	return (
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
	);
}
