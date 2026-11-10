"use client";

export default function FiltroOrdenacao({
	busca,
	aoMudarBusca,
	ordenacao,
	aoMudarOrdenacao,
	controleEsquerdo = null,
}) {
	return (
		<div className="relative z-10 mb-4 flex w-full min-w-0 flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center sm:gap-3">
			{controleEsquerdo}
			<input
				type="text"
				value={busca}
				onChange={(e) => aoMudarBusca(e.target.value)}
				placeholder="Pesquisar linha"
				className="min-w-0 w-full flex-1 rounded-full border border-borda px-4 py-3 text-center text-base focus:ring-2 focus:ring-acento focus:outline-none sm:py-2 sm:text-left"
			/>

			<div className="w-full shrink-0 sm:w-auto">
				<select
					value={ordenacao}
					onChange={(e) => aoMudarOrdenacao(e.target.value)}
					className="w-full cursor-pointer rounded-full border border-borda bg-superficie px-4 py-3 text-center text-sm font-bold text-texto-suave focus:ring-2 focus:ring-acento focus:outline-none sm:py-2"
				>
					<option value="padrao">Ordenar: Padrão</option>
					<option value="nome">Nome (A-Z)</option>
					<option value="tempo">Horário</option>
				</select>
			</div>
		</div>
	);
}
