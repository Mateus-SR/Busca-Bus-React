import Link from 'next/link';
import { MapPinned } from 'lucide-react';
import RelogioZoomPanel from '@/components/exibicao/RelogioZoomPanel';
import ExibicaoLive from '@/components/exibicao/ExibicaoLive';
import Footer from '@/components/layout/Footer';

export default async function ExibicaoPage({ params }) {
	const { codigo } = await params;

	return (
		<>
			<RelogioZoomPanel />

			<Link
				href={`/exibicao/${codigo}/mapa`}
				className="border-sptrans font-roboto-mono text-sptrans hover:bg-sptrans fixed bottom-7 z-30 flex items-center rounded-lg border-2 bg-white px-4 py-2 font-bold shadow-2xs transition duration-300 ease-in-out hover:text-white"
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
