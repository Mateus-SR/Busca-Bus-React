"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const BusMap = dynamic(() => import("@/components/mapa/BusMap"), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[420px] items-center justify-center">Carregando mapa...</div>,
});

export default function MapaView({ codigo, voltarHref, onibus }) {
  return (
    <main className="flex h-[calc(100dvh-68px)] min-h-[32rem] flex-col overflow-hidden bg-gray-100">
      <div className="relative flex-1">
        <Link href={voltarHref} className="absolute top-3 left-3 z-[1000] flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-black shadow-lg transition hover:bg-gray-200 sm:top-4 sm:left-6 sm:px-4 sm:text-base">
          ← Voltar
        </Link>
        <BusMap codigo={codigo} onibus={onibus} />
      </div>
    </main>
  );
}
