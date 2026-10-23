"use client";

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPinned } from 'lucide-react';
import RelogioZoomPanel from '@/components/exibicao/RelogioZoomPanel';
import ExibicaoLive from '@/components/exibicao/ExibicaoLive';
import Footer from '@/components/layout/Footer';
import AcessoRapidoForm from '@/components/home/AcessoRapidoForm';

function ExibicaoComParametro() {
	const searchParams = useSearchParams();
	const codigo = searchParams.get('codigo');

	if (!codigo) {
		return (
			<main className="flex min-h-[calc(100vh-68px)] flex-col items-center justify-center">
				<h1 className="text-center text-3xl font-bold">Acessar exibição</h1>
				<p className="mt-3 text-center text-gray-600">
					Informe o código de seis caracteres para continuar.
				</p>
				<AcessoRapidoForm />
			</main>
		);
	}

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

export default function ExibicaoPage() {
	return (
		<Suspense fallback={<main className="min-h-screen" />}>
			<ExibicaoComParametro />
		</Suspense>
	);
}
