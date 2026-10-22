export function Metric({ label, value, className = '' }) {
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
export function Destaque({ rotulo, valor, detalhe, titulo, alerta = false }) {
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
export function Cartao({ titulo, aberto = false, className = '', children }) {
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

export function LinhaFunil({ rotulo, valor, detalhe, destaque = false }) {
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

// Classes de botão e seletor repetidas em mais de um bloco do painel.
export const botaoSecundario =
	'rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600';
export const seletor =
	'rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm';
