import { formatarBytes } from './formatadores';
import { Cartao, Metric } from './ui';

export default function CartaoSocketSala({
	resumo,
	unidadeSnapshot,
	setUnidadeSnapshot,
}) {
	const { paradas, socket, frontend, soma, maior } = resumo;
	return (
		<Cartao titulo="Socket e sala">
			<dl className="grid grid-cols-2 gap-2">
				<Metric label="Socket conectado" value={socket ? 'sim' : 'não'} />
				<Metric label="Salas ativas" value={socket?.salasAtivas} />
				<Metric
					label="Inscrições nas paradas (todas as salas)"
					value={`${soma('referenciasAtivas')} (${maior('referenciasAtivas') ?? 0}x${paradas.length})`}
					className="col-span-1"
				/>
				<div className="col-span-1 rounded border bg-superficie-sutil p-2 text-texto-forte">
					<dt className="flex items-center justify-between gap-1 text-xs text-texto-secundario">
						Snapshot atual / total (sala)
						<select
							value={unidadeSnapshot}
							onChange={(evento) => setUnidadeSnapshot(evento.target.value)}
							aria-label="Unidade do tamanho do snapshot"
							className="rounded border bg-superficie px-1 text-xs text-texto-forte"
						>
							<option value="auto">Auto</option>
							<option value="KB">KB</option>
							<option value="MB">MB</option>
							<option value="GB">GB</option>
						</select>
					</dt>
					<dd className="font-roboto-mono text-sm font-bold text-texto-maximo">{`${formatarBytes(socket?.snapshotBytesAtual ?? frontend?.snapshotBytesAtual, unidadeSnapshot) ?? '—'} / ${formatarBytes(socket?.snapshotBytesTotal ?? frontend?.snapshotBytesTotal, unidadeSnapshot) ?? '—'}`}</dd>
				</div>
			</dl>
		</Cartao>
	);
}
