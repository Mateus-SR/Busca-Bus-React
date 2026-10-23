import Link from 'next/link';
import { MapPinned } from 'lucide-react';
import RelogioZoomPanel from '@/components/exibicao/RelogioZoomPanel';
import ExibicaoLive from '@/components/exibicao/ExibicaoLive';
import Footer from '@/components/layout/Footer';
import { EXIBICOES_MOCK } from '@/lib/fixtures/exibicoesFixture';

export function generateStaticParams() {
	return [
		...EXIBICOES_MOCK.map(({ codigo_exib }) => ({ codigo: codigo_exib })),
		{ codigo: 'dev' },
	];
}

export default async function ExibicaoPage({ params }) {
	const { codigo } = await params;

	return (
		<>
			<RelogioZoomPanel />

			<Link
				href={`/mapa?codigo=${encodeURIComponent(codigo)}`}
				className="border-sptrans font-roboto-mono text-sptrans hover:bg-sptrans fixed right-4 bottom-4 z-30 flex items-center rounded-lg border-2 bg-white px-3 py-2 text-sm font-bold shadow-2xs transition duration-300 ease-in-out hover:text-white sm:right-7 sm:bottom-7 sm:px-4 sm:text-base"
			>
				<MapPinned className="mr-2" size={20} />
				Abrir Mapa
			</Link>

			<section className="max-w-full px-2 sm:px-4 lg:px-10">
				{/* `key` remonta o componente ao trocar de exibição: nenhum estado (ônibus, métricas, eventos) vaza de uma para outra. */}
				<ExibicaoLive key={codigo} codigo={codigo} />
			</section>
			<Footer fixo />
		</>
	);
}
