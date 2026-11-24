"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { mesclarPontos } from "@busca-bus/core";
import LegendaPontos from "@/components/mapa/LegendaPontos";
import useRadarOnibus from "@/hooks/useRadarOnibus";
import useExibicao from "@/hooks/useExibicao";
import useDadosPontos from "@/hooks/useDadosPontos";

const BusMap = dynamic(() => import("@/components/mapa/BusMap"), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[420px] items-center justify-center">Carregando mapa...</div>,
});

export default function MapaView({ codigo, voltarHref, onibus = [], pontos = [] }) {
  const { exibicao, carregando } = useExibicao(codigo);
  const radar = useRadarOnibus(codigo, onibus, false, 0, {
    parada: exibicao?.paradas?.[0],
    paradas: exibicao?.paradas,
    config: exibicao?.config,
    aguardar: carregando || !exibicao?.paradas?.length,
  });
  const dadosOnibus = codigo ? radar.onibus : onibus;
  // Nome e endereço vêm do cadastro (GTFS), que o radar da SPTrans não traz; o radar segue mandando a posição ao vivo.
  const cadastro = useDadosPontos(codigo ? exibicao?.paradas : null);
  const dadosPontos = codigo ? mesclarPontos({ radar: radar.pontos, cadastro, paradas: exibicao?.paradas }) : pontos;

  return (
    <main className="flex h-[calc(100dvh-68px)] min-h-[32rem] flex-col overflow-hidden bg-superficie-alt">
      <div className="relative flex-1">
        <Link href={voltarHref} className="absolute top-3 left-3 z-[1000] flex items-center gap-2 rounded-full bg-superficie px-3 py-2 text-sm font-bold text-texto shadow-lg transition hover:bg-superficie-forte sm:top-4 sm:left-6 sm:px-4 sm:text-base">
          ← Voltar
        </Link>
        <BusMap codigo={codigo} onibus={dadosOnibus} pontos={dadosPontos} ponto={radar.ponto} />
        <LegendaPontos pontos={dadosPontos} />
      </div>
    </main>
  );
}
