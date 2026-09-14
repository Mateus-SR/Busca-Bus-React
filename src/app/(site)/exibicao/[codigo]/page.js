import Link from "next/link";
import { MapPinned } from "lucide-react";
import { FIXTURE_ONIBUS } from "@/lib/fixtures/exibicaoFixture";
import ExibicaoTable from "@/components/exibicao/ExibicaoTable";
import FavoriteStar from "@/components/exibicao/FavoriteStar";
import RelogioZoomPanel from "@/components/exibicao/RelogioZoomPanel";

export default async function ExibicaoPage({ params }) {
	const { codigo } = await params;

	return (
		<>
			<div className="hidden animate-pulse bg-blue-100 bg-blue-600 bg-green-100 bg-green-600 bg-yellow-100 bg-yellow-600 text-blue-400 text-green-400 text-yellow-400" />

			<RelogioZoomPanel />

			<Link
				href={`/exibicao/${codigo}/mapa`}
				className="fixed bottom-7 z-30 flex items-center rounded-lg border-2 border-sptrans bg-white px-4 py-2 font-roboto-mono font-bold text-sptrans shadow-2xs transition duration-300 ease-in-out hover:bg-sptrans hover:text-white"
			>
				<MapPinned className="mr-2" size={20} />
				Abrir Mapa
			</Link>

			<section className="max-w-full px-4 lg:px-10">
				<div className="overflow-x-auto rounded-2xl bg-white p-6 shadow-lg">
					<div className="mb-2 flex flex-col items-center">
						<div className="flex items-center gap-3">
							<span className="text-xl font-bold">Exibição</span>
							<FavoriteStar />
						</div>

						<span className="font-roboto-mono text-sm italic">
							Código: {codigo}
						</span>
					</div>

					<ExibicaoTable onibus={FIXTURE_ONIBUS} />
				</div>
			</section>

			<footer className="fixed bottom-0 z-50 flex h-[20px] w-full items-center justify-between bg-sptrans px-2.5 font-roboto-mono text-[10px] font-medium text-white">
				<div className="relative mr-0 flex h-full flex-1 items-center justify-end overflow-hidden">
					<div className="inline-block w-full animate-marquee text-right whitespace-nowrap">
						Desenvolvido por: João Pedro, Mateus S. Rodrigues e Pedro H. Giacomo
					</div>
				</div>

				<div className="z-20 flex h-full items-center border-l-2 border-red-800 bg-sptrans pl-4 whitespace-nowrap">
					<p>Versão: 1.1.1</p>
				</div>
			</footer>
		</>
	);
}
