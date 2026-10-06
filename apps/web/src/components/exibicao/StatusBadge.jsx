export default function StatusBadge({ status }) {
    // Mapeamento estático completo para que o Tailwind compile corretamente todas as classes
    const CONFIG_CORES = {
        green: {
            container: "bg-green-100 text-green-700",
            pulse: "bg-green-100 text-green-400",
            dot: "bg-green-600"
        },
        yellow: {
            container: "bg-yellow-100 text-yellow-700",
            pulse: "bg-yellow-100 text-yellow-400",
            dot: "bg-yellow-600"
        },
        blue: {
            container: "bg-blue-100 text-blue-700",
            pulse: "bg-blue-100 text-blue-400",
            dot: "bg-blue-600"
        }
    };

    const corNome = {
        Normal: 'green',
        Atrasado: 'yellow',
        Adiantado: 'blue',
    }[status] || 'green';

    const estilos = CONFIG_CORES[corNome];

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold lg:text-lg ${estilos.container}`}
        >
            <span className="relative mr-2 flex h-2 w-2">
                <span
                    className={`animate-pulse absolute inline-flex h-full w-full rounded-full opacity-75 ${estilos.pulse}`}
                />
                <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${estilos.dot}`}
                />
            </span>
            {status}
        </span>
    );
}