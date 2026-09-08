import { exportTraceState } from 'next/dist/trace';

const CORES_POR_STATUS = {
	Normal: 'green',
	Atrasado: 'yellow',
	Adiantado: 'blue',
};

export default function StatusBadge({ status }) {
	const cor = CORES_POR_STATUS[status] ?? 'green';

	return (
		<span
			className={`inline-flex items-center rounded-full px-3 py-1 bg-${cor}-100 text-${cor}-700 text-sm font-semibold lg:text-lg`}
		>
			<span className="relative mr-2 flex h-2 w-2">
				<span
					className={`animate-pulse absolute inline-flex h-full w-full rounded-full bg-${cor}-100 text-${cor}-400 opacity-75`}
				/>
				<span
					className={`relative inline-flex h-2 w-2 rounded-full bg-${cor}-600`}
				/>
			</span>
			{status}
		</span>
	);
}
