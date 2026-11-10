import ExibicoesTable from '@/components/listas/ExibicoesTable';
export default function FavoritosPage() {
	return (
		<main className="px-4 py-8 sm:px-6 lg:py-12">
			<div className="mx-auto max-w-6xl rounded-2xl bg-superficie p-5 shadow-sm sm:p-8">
				<ExibicoesTable modo="favoritos" />
			</div>
		</main>
	);
}
