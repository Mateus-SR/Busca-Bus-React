import { FIXTURE_ONIBUS } from '@/lib/fixtures/exibicaoFixture';
import StatusBadge from '@/components/exibicao/StatusBadge';

export default async function ExibicaoPage({ params }) {
	const { codigo } = await params;

	return (
		<section className="max-w-full px-4 py-6 lg:px-10">
			<div className="hidden animate-pulse bg-blue-100 bg-blue-600 bg-green-100 bg-green-600 bg-yellow-100 bg-yellow-600 text-blue-400 text-green-400 text-yellow-400" />
			<div className="mx-10 overflow-x-auto rounded-2xl bg-white p-6 shadow-lg">
				<div className="mb-4 flex flex-col items-center">
					<span className="text-xl font-bold">Exibição</span>
					<span className="font-roboto-mono text-sm italic">
						Código: {codigo}
					</span>
				</div>

				<table className="mx-auto min-w-full table-auto border-collapse lg:text-2xl">
					<thead>
						<tr className="bg-gray-100 font-extrabold">
							<th className="px-6 py-1.5 text-center">Código</th>
							<th className="px-6 py-1.5 text-center">Nome</th>
							<th className="px-6 py-1.5 text-center">Previsão</th>
							<th className="px-6 py-1.5 text-center">Status</th>
						</tr>
					</thead>
					<tbody>
						{FIXTURE_ONIBUS.map((onibus) => (
							<tr key={onibus.id} className="border-b hover:bg-gray-50">
								<td className="px-6 py-3 text-center font-extrabold">
									{onibus.codigoLetreiro}
								</td>
								<td className="px-6 py-3 text-center">{onibus.sentidoLinha}</td>
								<td className="px-6 py-3 text-center">{onibus.previsao}</td>
								<td className="px-6 py-3 text-center">
									<StatusBadge status={onibus.status} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
