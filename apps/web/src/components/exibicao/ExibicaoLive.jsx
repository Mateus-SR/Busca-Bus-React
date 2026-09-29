"use client";

import ExibicaoTable from "@/components/exibicao/ExibicaoTable";
import FavoriteStar from "@/components/exibicao/FavoriteStar";
import useExibicao from "@/hooks/useExibicao";
import useRadarOnibus from "@/hooks/useRadarOnibus";

export default function ExibicaoLive({ codigo }) {
  const { exibicao, onibus } = useExibicao(codigo);
  const radar = useRadarOnibus(onibus);
  return <div className="overflow-x-auto rounded-2xl bg-white p-6 shadow-lg"><div className="mb-2 flex flex-col items-center"><div className="flex items-center gap-3"><span className="text-xl font-bold">{exibicao.nome_exibicao}</span><FavoriteStar /></div><span className="font-roboto-mono text-sm italic">Código: {codigo}</span></div><ExibicaoTable onibus={radar.onibus} /></div>;
}
