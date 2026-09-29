"use client";

export default function FiltroOrdenacao({
	busca,
	aoMudarBusca,
	ordenacao,
	aoMudarOrdenacao,
}) {
	return (
		<div className="relative z-10 mb-4 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
			<input
				type="text"
				value={busca}
				onChange={(e) => aoMudarBusca(e.target.value)}
				placeholder="Pesquisar linha"
				className="w-full rounded-full border border-gray-300 px-4 py-2 text-center text-base focus:ring-2 focus:ring-sptrans focus:outline-none sm:w-96 sm:text-left"
			/>

			<div className="w-full sm:absolute sm:right-0 sm:w-96">
				<select
					value={ordenacao}
					onChange={(e) => aoMudarOrdenacao(e.target.value)}
					className="w-full cursor-pointer rounded-full border border-gray-300 bg-white px-4 py-2 text-center text-sm font-bold text-gray-700 focus:ring-2 focus:ring-sptrans focus:outline-none sm:w-auto"
				>
					<option value="padrao">Ordenar: Padrão</option>
					<option value="nome">Nome (A-Z)</option>
					<option value="tempo">Horário</option>
				</select>
			</div>
		</div>
	);
}
