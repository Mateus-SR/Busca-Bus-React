import Link from "next/link";
import { MapPinned } from "lucide-react";
import RelogioZoomPanel from "@/components/exibicao/RelogioZoomPanel";
import ExibicaoLive from "@/components/exibicao/ExibicaoLive";
import Footer from "@/components/layout/Footer";

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
				<ExibicaoLive codigo={codigo} />
			</section>
			<Footer />
		</>
	);
}
