import CalendarioComEventos from '@/components/calendario/CalendarioComEventos';

export const metadata = {
	title: 'Calendário de eventos | Busca Bus',
};

export default function CalendarioPage() {
	return (
		<main className="font-inter px-4 py-8 sm:px-6 sm:py-10">
			<div className="mx-auto w-full max-w-300">
				<CalendarioComEventos />
			</div>
		</main>
	);
}