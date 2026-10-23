"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ConfiguracaoForm from '@/components/configuracao/ConfiguracaoForm';

function ConfiguracaoComParametro() {
	const searchParams = useSearchParams();
	const codigo = searchParams.get('editar') || undefined;
	return (
		<main className="relative min-h-screen bg-[url(/img/Onibus2.png)] bg-cover bg-center">
			<div className="absolute inset-0 bg-black/40" />
			<div className="relative min-h-screen px-2 py-4">
				<ConfiguracaoForm key={codigo ?? 'nova'} codigo={codigo} />
			</div>
		</main>
	);
}

export default function ConfiguracaoPage() {
	return (
		<Suspense fallback={<main className="min-h-screen" />}>
			<ConfiguracaoComParametro />
		</Suspense>
	);
}
