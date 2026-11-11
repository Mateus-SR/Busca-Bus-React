"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ConfiguracaoForm from '@/components/configuracao/ConfiguracaoForm';

function ConfiguracaoComParametro() {
	const searchParams = useSearchParams();
	const codigo = searchParams.get('editar') || undefined;
	// Vem da página /pontos (um ou vários ?parada=); só vale ao criar uma exibição, não ao editar.
	// Aceita só dígitos (até 9), sem repetir, e no máximo 5 pontos, que é o limite do formulário.
	const paradasIniciais = codigo ? [] : [...new Set(searchParams.getAll('parada').map((valor) => valor.replace(/\D/g, '').slice(0, 9)).filter(Boolean))].slice(0, 5);
	return (
		<main className="relative min-h-screen bg-[url(/img/Onibus2.png)] bg-cover bg-center contraste:bg-none">
			<div className="absolute inset-0 bg-black/40 contraste:hidden" />
			<div className="relative min-h-screen px-2 py-4">
				<ConfiguracaoForm key={codigo ?? `nova-${paradasIniciais.join('-')}`} codigo={codigo} paradasIniciais={paradasIniciais} />
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
