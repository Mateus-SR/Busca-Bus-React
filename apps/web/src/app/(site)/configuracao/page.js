"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LIMITE_PARADAS_EXIBICAO, codigoParadaValido, limparCodigoParada } from '@busca-bus/core';
import ConfiguracaoForm from '@/components/configuracao/ConfiguracaoForm';

function ConfiguracaoComParametro() {
	const searchParams = useSearchParams();
	const codigo = searchParams.get('editar') || undefined;
	// `rascunho=1`: volta do mapa (/pontos), com o formulário que já estava preenchido guardado na aba.
	const usarRascunho = searchParams.get('rascunho') === '1';
	// Vem da página /pontos (um ou vários ?parada=). Vale ao criar e, na volta do mapa, também ao editar.
	// Aceita só códigos válidos (dígitos, até 9), sem repetir, até o limite de pontos da exibição.
	const paradasIniciais = codigo && !usarRascunho ? [] : [...new Set(searchParams.getAll('parada').map(limparCodigoParada).filter(codigoParadaValido))].slice(0, LIMITE_PARADAS_EXIBICAO);
	return (
		<main className="relative min-h-screen bg-[url(/img/Onibus2.png)] bg-cover bg-center contraste:bg-none">
			<div className="absolute inset-0 bg-black/40 contraste:hidden" />
			<div className="relative min-h-screen px-2 py-4">
				<ConfiguracaoForm key={`${codigo ?? 'nova'}-${usarRascunho ? 'rascunho' : 'direto'}-${paradasIniciais.join('-')}`} codigo={codigo} paradasIniciais={paradasIniciais} usarRascunho={usarRascunho} />
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
