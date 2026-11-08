const ESTILOS = {
    Normal: { badge: "bg-status-ok-fundo text-status-ok-texto", ping: "bg-status-ok-ping", dot: "bg-status-ok-ponto" },
    Atrasado: { badge: "bg-status-atraso-fundo text-status-atraso-texto", ping: "bg-status-atraso-ping", dot: "bg-status-atraso-ponto" },
    Adiantado: { badge: "bg-status-adiantado-fundo text-status-adiantado-texto", ping: "bg-status-adiantado-ping", dot: "bg-status-adiantado-ponto" },
};

export default function StatusBadge({ status }) {
    const estilo = ESTILOS[status] ?? ESTILOS.Normal;

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold contraste:border-2 contraste:border-borda contraste:font-extrabold lg:text-lg ${estilo.badge}`}
        >
            <span className="relative mr-2 flex h-2 w-2">
                <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 contraste:border contraste:border-black ${estilo.ping}`}
                />
                <span
                    className={`relative inline-flex h-2 w-2 rounded-full contraste:border contraste:border-black ${estilo.dot}`}
                />
            </span>
            {status}
        </span>
    );
}