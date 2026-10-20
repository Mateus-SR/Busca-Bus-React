import ConfiguracaoForm from '@/components/configuracao/ConfiguracaoForm';
import { EXIBICOES_MOCK } from '@/lib/fixtures/exibicoesFixture';

export function generateStaticParams() {
	return EXIBICOES_MOCK.map(({ codigo_exib }) => ({ codigo: codigo_exib }));
}
export default async function ConfiguracaoEdicaoPage({ params }) {
	const { codigo } = await params;
	return (
		<main className="relative min-h-screen bg-[url(/img/Onibus2.png)] bg-cover bg-center">
			<div className="absolute inset-0 bg-black/40" />
			<div className="relative min-h-screen px-2 py-4">
				<ConfiguracaoForm codigo={codigo} />
			</div>
		</main>
	);
}
