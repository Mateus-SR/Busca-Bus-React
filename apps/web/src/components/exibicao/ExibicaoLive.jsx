"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Copy, Share2 } from "lucide-react";
import ExibicaoTable from "@/components/exibicao/ExibicaoTable";
import FavoriteStar from "@/components/exibicao/FavoriteStar";
import InlineToast from "@/components/ui/InlineToast";
import useExibicao from "@/hooks/useExibicao";
import useRadarOnibus from "@/hooks/useRadarOnibus";
import VisaoDesenvolvedor from "@/components/exibicao/VisaoDesenvolvedor";

export default function ExibicaoLive({ codigo }) {
  const { exibicao, carregando: carregandoExibicao, erro: erroExibicao } = useExibicao(codigo);
  // Sem paradas não há o que consultar: o servidor cairia na parada de teste e mostraria ônibus de outro ponto.
  const semParadas = !carregandoExibicao && !exibicao?.paradas?.length;
  // Só com a API configurada: sem ela a tela roda em fixtures e não há conexão a esperar.
  const mostrarSemParadas = semParadas && Boolean(process.env.NEXT_PUBLIC_API_URL);
  const [debugAberto, setDebugAberto] = useState(false);
  const [permitirMultiplosPorLinha, setPermitirMultiplosPorLinha] = useState(false);
  const [atualizacaoSolicitada, setAtualizacaoSolicitada] = useState(0);
  const [mensagemAcao, setMensagemAcao] = useState(null);
  const opcoesRadar = useMemo(() => ({
    parada: exibicao?.paradas?.[0],
    paradas: exibicao?.paradas,
    config: { ...exibicao?.config, permitirMultiplosPorLinha },
    aguardar: carregandoExibicao || semParadas,
  }),[exibicao?.paradas, exibicao?.config, permitirMultiplosPorLinha, carregandoExibicao, semParadas]);
  const radar = useRadarOnibus(codigo, [], debugAberto, atualizacaoSolicitada, opcoesRadar);
  
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

  async function copiarTexto(texto, sucesso) {
    try {
      await navigator.clipboard.writeText(texto);
      setMensagemAcao({ id: Date.now(), texto: sucesso, cor: "bg-green-600" });
    } catch {
      setMensagemAcao({
        id: Date.now(),
        texto: "Não foi possível copiar. Tente novamente.",
        cor: "bg-red-600",
      });
    }
  }

  function copiarCodigo() {
    void copiarTexto(codigo, "Código copiado para a área de transferência");
  }

  async function compartilhar() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: exibicao?.nome || "Exibição de ônibus",
          text: `Acesse esta exibição de ônibus: ${codigo}`,
          url,
        });
        return;
      } catch (erro) {
        if (erro.name === "AbortError") return;
      }
    }

    await copiarTexto(url, "Link da exibição copiado para a área de transferência");
  }

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
        <div className="mt-1 flex flex-col items-center gap-2 text-sm">
          <span className="font-roboto-mono italic">Código: {codigo}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copiarCodigo}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
              aria-label="Copiar código da exibição"
            >
              <Copy size={14} aria-hidden="true" />
              Copiar
            </button>
            <button
              type="button"
              onClick={compartilhar}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
              aria-label="Compartilhar exibição"
            >
              <Share2 size={14} aria-hidden="true" />
              Compartilhar
            </button>
          </div>
        </div>
        <InlineToast key={mensagemAcao?.id} mensagem={mensagemAcao} />
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
        conexao={radar.conexao}
        eventosConexao={radar.eventosConexao}
        onSimular={radar.simular}
        onAtualizar={async () => {
          const resposta = await radar.atualizar();
          // Sem socket não há a quem pedir: reconectar é o único jeito de buscar dados novos.
          if (resposta.semSocket) {
            setAtualizacaoSolicitada((valor) => valor + 1);
            return { ok: true, reconectando: true };
          }
          return resposta;
        }}
      />
      
      {mostrarSemParadas && (
        <p role="status" className="mb-3 text-center text-sm text-red-600">
          {erroExibicao
            ? `Não foi possível carregar a exibição: ${erroExibicao}`
            : "Esta exibição não tem pontos de parada cadastrados."}
        </p>
      )}
      {radar.erro && (
        <p role="status" className="mb-3 text-center text-sm text-red-600">
          Não foi possível atualizar o radar: {radar.erro}
        </p>
      )}
      {!radar.erro && !mostrarSemParadas && (
        <p role="status" className="mb-3 text-center text-sm text-gray-500">
          {radar.estadoConexao === "iniciando" ? "Conectando ao radar..." : `Radar ${radar.estadoConexao}.`}
        </p>
      )}
      <ExibicaoTable onibus={radar?.onibus ?? []} detalhesTecnicos={debugAberto} />
    </div>
  );
}