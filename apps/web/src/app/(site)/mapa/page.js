"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MapaView from "@/components/mapa/MapaView";
import { ONIBUS_MAPA_MOCK } from "@/lib/fixtures/mapaFixture";

function MapaComParametro() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get("codigo") || null;
  return <MapaView codigo={codigo} voltarHref={codigo ? `/exibicao/${codigo}` : "/"} onibus={ONIBUS_MAPA_MOCK} />;
}

export default function MapaPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-100" />}>
      <MapaComParametro />
    </Suspense>
  );
}
