import ConfiguracaoForm from '@/components/configuracao/ConfiguracaoForm';
export default function ConfiguracaoPage() {
	return (
		<main className="relative min-h-screen bg-[url(/img/Onibus2.png)] bg-cover bg-center">
			<div className="absolute inset-0 bg-black/40" />
			<div className="relative min-h-screen px-2 py-4">
				<ConfiguracaoForm />
			</div>
		</main>
	);
}
