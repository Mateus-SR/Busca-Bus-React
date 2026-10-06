const ESTILOS = {
    Normal: { badge: "bg-green-100 text-green-700", ping: "bg-green-400", dot: "bg-green-600" },
    Atrasado: { badge: "bg-yellow-100 text-yellow-700", ping: "bg-yellow-400", dot: "bg-yellow-600" },
    Adiantado: { badge: "bg-blue-100 text-blue-700", ping: "bg-blue-400", dot: "bg-blue-600" },
};

export default function StatusBadge({ status }) {
    const estilo = ESTILOS[status] ?? ESTILOS.Normal;

    return (
        <span
            className={`status-badge inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold lg:text-lg ${estilo.badge}`}
        >
            <span className="relative mr-2 flex h-2 w-2">
                <span
                    className={`status-badge-ping absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${estilo.ping}`}
                />
                <span
                    className={`status-badge-dot relative inline-flex h-2 w-2 rounded-full ${estilo.dot}`}
                />
            </span>
            {status}
        </span>
    );
}