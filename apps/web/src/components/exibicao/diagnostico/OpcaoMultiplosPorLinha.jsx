// Checkbox que altera, para a sala inteira, o "vários ônibus por linha". Aparece em dois pontos do painel, cada um
// com o seu estilo (`className`).
export default function OpcaoMultiplosPorLinha({
	marcado,
	aoAlterar,
	className,
}) {
	return (
		<label className={className}>
			<input
				type="checkbox"
				checked={marcado}
				onChange={(evento) => aoAlterar(evento.target.checked)}
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
	);
}
