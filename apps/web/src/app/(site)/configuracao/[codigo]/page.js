import ConfiguracaoForm from '@/components/configuracao/ConfiguracaoForm';
import { EXIBICOES_MOCK } from '@/lib/fixtures/exibicoesFixture';

export function generateStaticParams() {
	return EXIBICOES_MOCK.map(({ codigo_exib }) => ({ codigo: codigo_exib }));
}
export default async function ConfiguracaoEdicaoPage({ params }) {
	const { codigo } = await params;
	return (
		<main className="min-h-screen bg-[url(/img/Onibus2.png)] bg-cover bg-center py-1">
			<div className="min-h-screen bg-black/40">
				<ConfiguracaoForm codigo={codigo} />
			</div>
		</main>
	);
}
