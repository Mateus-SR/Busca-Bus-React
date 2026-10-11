"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import ExibicaoTable from "@/components/exibicao/ExibicaoTable";
import FavoriteStar from "@/components/exibicao/FavoriteStar";
import useExibicao from "@/hooks/useExibicao";
import useRadarOnibus from "@/hooks/useRadarOnibus";
import VisaoDesenvolvedor from "@/components/exibicao/VisaoDesenvolvedor";

export default function ExibicaoLive({ codigo }) {
  const { exibicao } = useExibicao(codigo);
  const [debugAberto, setDebugAberto] = useState(false);
  const [permitirMultiplosPorLinha, setPermitirMultiplosPorLinha] = useState(false);
  const [atualizacaoSolicitada, setAtualizacaoSolicitada] = useState(0);
  const opcoesRadar = useMemo(() => ({
    parada: exibicao?.paradas?.[0],
    paradas: exibicao?.paradas,
    config: { ...exibicao?.config, permitirMultiplosPorLinha },
  }),[exibicao?.paradas, exibicao?.config, permitirMultiplosPorLinha]);
  const radar = useRadarOnibus(codigo, [], debugAberto, atualizacaoSolicitada, opcoesRadar);
  const configurarDiagnosticoSocket = radar.configurarDiagnosticoSocket;
  
  const [mensagemVoz, setMensagemVoz] = useState("");
  
  // useRef guarda a lista de ônibus da última atualização para podermos comparar
  const onibusAnteriores = useRef([]);

  useEffect(() => {
    const aoPressionar = (evento) => {
      if (evento.ctrlKey && evento.shiftKey && evento.key.toLowerCase() === "d") {
        setDebugAberto((aberto) => !aberto);
      }
    };
    window.addEventListener("keydown", aoPressionar);
    return () => window.removeEventListener("keydown", aoPressionar);
  }, []);

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
          (antigo.id) === (atual.id)
        )
      );

      if (novosVeiculos.length > 0) {
        // Mapeia o número/nome da linha dos novos veículos
        const linhasNovas = novosVeiculos.map(v => v.codigoLetreiro || v.id || "desconhecida").join(", ");
        
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
    <div className="overflow-x-auto rounded-2xl bg-white p-3 shadow-lg sm:p-6">
      
      {/* Elemento invisível do leitor de tela */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {mensagemVoz}
      </div>

      {/* Interface visual */}
      <div className="mb-3 flex flex-col items-center">
        <div className="flex max-w-full items-center gap-2 text-center">
          <span className="truncate text-lg font-bold sm:text-xl">{exibicao?.nome}</span>
          <FavoriteStar />
        </div>
        <span className="font-roboto-mono text-sm italic">Código: {codigo}</span>
        {debugAberto && radar.pontos.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500 flex-col">
            {radar.pontos.map((item, indice) => (
              <span key={item.codigo ?? indice} className="flex flex-wrap justify-center gap-x-2">
                <span className="font-roboto-mono">
                  Ponto {item.codigo ?? "—"}
                </span>
                <span>{item.nome || "Sem nome cadastrado"}</span>
                {item.posicao && (
                  <span className="font-roboto-mono" title="Latitude, longitude">
                    {item.posicao.lat.toFixed(5)}, {item.posicao.lng.toFixed(5)}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setDebugAberto((aberto) => !aberto)} className="mt-1 text-xs text-gray-400 underline hover:text-gray-700">Detalhes técnicos</button>
      </div>
      <VisaoDesenvolvedor
        aberto={debugAberto}
        diagnostico={radar.diagnostico}
        historico={radar.historicoDiagnostico}
        eventosOnibus={radar.eventosOnibus}
        configuracao={exibicao?.config}
        permitirMultiplosPorLinha={radar.configuracao?.permitirMultiplosPorLinha ?? permitirMultiplosPorLinha}
        onPermitirMultiplosPorLinha={(permitir) => {
          setPermitirMultiplosPorLinha(permitir);
          radar.configurar({ ...exibicao?.config, permitirMultiplosPorLinha: permitir });
        }}
        onLimpar={radar.limparDiagnostico}
        onAtualizar={() => setAtualizacaoSolicitada((valor) => valor + 1)}
        diagnosticoSocketAtivo={radar.diagnosticoSocketAtivo}
        onDiagnosticoSocket={configurarDiagnosticoSocket}
      />
      
      {radar.erro && (
        <p role="status" className="mb-3 text-center text-sm text-red-600">
          Não foi possível atualizar o radar: {radar.erro}
        </p>
      )}
      {!radar.erro && (
        <p role="status" className="mb-3 text-center text-sm text-gray-500">
          {radar.estadoConexao === "iniciando" ? "Conectando ao radar..." : `Radar ${radar.estadoConexao}.`}
        </p>
      )}
      <ExibicaoTable onibus={radar?.onibus ?? []} detalhesTecnicos={debugAberto} />
    </div>
  );
}