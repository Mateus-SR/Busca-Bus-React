"use client";

import { useState, useEffect, useRef } from "react";
import ExibicaoTable from "@/components/exibicao/ExibicaoTable";
import FavoriteStar from "@/components/exibicao/FavoriteStar";
import useExibicao from "@/hooks/useExibicao";
import useRadarOnibus from "@/hooks/useRadarOnibus";

export default function ExibicaoLive({ codigo }) {
  const { exibicao, onibus } = useExibicao(codigo);
  const radar = useRadarOnibus(onibus);
  
  const [mensagemVoz, setMensagemVoz] = useState("");
  
  // useRef guarda a lista de ônibus da última atualização para podermos comparar
  const onibusAnteriores = useRef([]);

  useEffect(() => {
    if (!radar?.onibus) return;

    const onibusAtuais = radar.onibus;
    const antigos = onibusAnteriores.current;

    // 1. Primeiro carregamento: avisa o total inicial
    if (antigos.length === 0 && onibusAtuais.length > 0) {
      setMensagemVoz(`Rastreamento iniciado. ${onibusAtuais.length} veículos encontrados.`);
    } 
    // 2. Atualizações seguintes: compara e busca ônibus novos
    else if (antigos.length > 0) {
      // Filtra veículos que estão na lista atual, mas NÃO estavam na lista antiga
      // Na API da SPTrans, o identificador único costuma ser 'prefixo' ou 'p'
      const novosVeiculos = onibusAtuais.filter(
        (atual) => !antigos.find((antigo) => 
          (antigo.prefixo || antigo.id || antigo.p) === (atual.prefixo || atual.id || atual.p)
        )
      );

      if (novosVeiculos.length > 0) {
        // Mapeia o número/nome da linha dos novos veículos
        const linhasNovas = novosVeiculos.map(v => v.linha || v.letreiro || v.c || "desconhecida").join(", ");
        
        // Dispara a voz apenas com a novidade
        setMensagemVoz(
          novosVeiculos.length === 1 
            ? `Novo ônibus da linha ${linhasNovas} apareceu no radar.` 
            : `Novos ônibus detectados nas linhas: ${linhasNovas}.`
        );
      }
    }

    // Salva a lista atual para a próxima rodada de comparação
    onibusAnteriores.current = onibusAtuais;
  }, [radar?.onibus]);

  return (
    <div className="overflow-x-auto rounded-2xl bg-white p-6 shadow-lg">
      
      {/* Elemento invisível do leitor de tela */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {mensagemVoz}
      </div>

      {/* Interface visual */}
      <div className="mb-2 flex flex-col items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">{exibicao?.nome_exibicao}</span>
          <FavoriteStar />
        </div>
        <span className="font-roboto-mono text-sm italic">Código: {codigo}</span>
      </div>
      
      <ExibicaoTable onibus={radar?.onibus} />
    </div>
  );
}