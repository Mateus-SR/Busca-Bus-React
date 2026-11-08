import ExibicoesTable from '@/components/listas/ExibicoesTable';
export default function FavoritosPage() {
	return (
		<main>
			<div className="my-6 flex justify-center">
				<h1 className="font-roboto-mono text-2xl font-bold">Seus favoritos:</h1>
			</div>
			<div className="mx-auto max-w-5xl overflow-x-auto rounded-xl bg-superficie p-6 shadow">
				<ExibicoesTable modo="favoritos" />
			</div>
		</main>
	);
}
