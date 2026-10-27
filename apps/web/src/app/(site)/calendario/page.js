import CalendarioView from '@/components/calendario/CalendarioView';
import { EVENTOS_MOCK } from '@/lib/fixtures/eventosFixture';

export const metadata = {
	title: 'Calendário de eventos | Busca Bus',
};

export default function CalendarioPage() {
	const eventosFatecZl = EVENTOS_MOCK.filter(
		(evento) => evento.instituicao === 'fatec-zl'
	);

	return (
		<main className="font-inter px-4 py-8 sm:px-6 sm:py-10">
			<div className="mx-auto w-full max-w-300">
				<div className="text-sptrans text-sm font-black tracking-[0.18em] uppercase">
					Fatec Zona Leste
				</div>
				<CalendarioView eventos={eventosFatecZl} />
			</div>
		</main>
	);
}
