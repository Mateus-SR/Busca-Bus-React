"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const BusMap = dynamic(() => import("@/components/mapa/BusMap"), { ssr: false, loading: () => <div className="flex h-full min-h-[420px] items-center justify-center">Carregando mapa...</div> });

export default function MapaPage() {
  return <main className="flex h-[calc(100vh-68px)] flex-col overflow-hidden bg-gray-100"><div className="relative flex-1"><Link href="/" className="absolute top-4 left-6 z-[1000] flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-black shadow-lg transition hover:bg-gray-200">← Voltar</Link><BusMap /></div></main>;
}
