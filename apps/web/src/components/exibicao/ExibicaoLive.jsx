"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { BusFront, Copy, MapPin, Share2 } from "lucide-react";
import ExibicaoTable from "@/components/exibicao/ExibicaoTable";
import FavoriteStar from "@/components/exibicao/FavoriteStar";
import InlineToast from "@/components/ui/InlineToast";
import useExibicao from "@/hooks/useExibicao";
import useRadarOnibus from "@/hooks/useRadarOnibus";
import VisaoDesenvolvedor from "@/components/exibicao/VisaoDesenvolvedor";
import EventosProximos from "@/components/exibicao/EventosProximos";
import { useAuth } from "@/contexts/AuthContext";

const INTERVALO_RODIZIO_SEGUNDOS = 15;

export default function ExibicaoLive({ codigo }) {
  const { exibicao, carregando: carregandoExibicao, erro: erroExibicao } = useExibicao(codigo);
  const { usuario, accessToken } = useAuth();
  // Sem paradas não há o que consultar: o servidor cairia na parada de teste e mostraria ônibus de outro ponto.
  const semParadas = !carregandoExibicao && !exibicao?.paradas?.length;
  // Só com a API configurada: sem ela a tela roda em fixtures e não há conexão a esperar.
  const mostrarSemParadas = semParadas && Boolean(process.env.NEXT_PUBLIC_API_URL);
  const [debugAberto, setDebugAberto] = useState(false);
  const podeVerDetalhesTecnicos = Boolean(usuario?.role === "admin"
    || (usuario?.id && exibicao?.usuarioId && String(usuario.id) === String(exibicao.usuarioId)));
  const [modoVisualizacao, setModoVisualizacao] = useState("completa");
  const [pontoComCodigoVisivel, setPontoComCodigoVisivel] = useState(null);
  const [indicePontoRodizio, setIndicePontoRodizio] = useState(0);
  const [segundosParaProximoPonto, setSegundosParaProximoPonto] = useState(INTERVALO_RODIZIO_SEGUNDOS);
  const indicePontoRodizioRef = useRef(0);
  const [permitirMultiplosPorLinha, setPermitirMultiplosPorLinha] = useState(false);
  const [atualizacaoSolicitada, setAtualizacaoSolicitada] = useState(0);
  const [mensagemAcao, setMensagemAcao] = useState(null);
  const opcoesRadar = useMemo(() => ({
    parada: exibicao?.paradas?.[0],
    paradas: exibicao?.paradas,
    config: { ...exibicao?.config, permitirMultiplosPorLinha },
    aguardar: carregandoExibicao || semParadas,
  }),[exibicao?.paradas, exibicao?.config, permitirMultiplosPorLinha, carregandoExibicao, semParadas]);
  useEffect(() => {
    if (!podeVerDetalhesTecnicos) setDebugAberto(false);
  }, [podeVerDetalhesTecnicos]);
  const radar = useRadarOnibus(codigo, [], podeVerDetalhesTecnicos && debugAberto, atualizacaoSolicitada, opcoesRadar, accessToken);
  const controleModoVisualizacao = (
    <div
      className="inline-flex w-full rounded-lg border border-borda bg-superficie-alt p-1 sm:w-auto"
      role="group"
      aria-label="Modo de exibição dos ônibus"
    >
      <button
        type="button"
        onClick={() => setModoVisualizacao("completa")}
        aria-pressed={modoVisualizacao === "completa"}
        className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition sm:flex-none sm:px-4 ${
          modoVisualizacao === "completa"
            ? "bg-marca text-superficie"
            : "text-texto-suave hover:bg-superficie"
        }`}
      >
        Todos os pontos
      </button>
      <button
        type="button"
        onClick={() => setModoVisualizacao("por-ponto")}
        aria-pressed={modoVisualizacao === "por-ponto"}
        className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition sm:flex-none sm:px-4 ${
          modoVisualizacao === "por-ponto"
            ? "bg-marca text-superficie"
            : "text-texto-suave hover:bg-superficie"
        }`}
      >
        Separar por ponto
      </button>
      <button
        type="button"
        onClick={() => setModoVisualizacao("rodizio")}
        aria-pressed={modoVisualizacao === "rodizio"}
        className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition sm:flex-none sm:px-4 ${
          modoVisualizacao === "rodizio"
            ? "bg-marca text-superficie"
            : "text-texto-suave hover:bg-superficie"
        }`}
      >
        Rodízio por ponto
      </button>
    </div>
  );
  const onibusPorPonto = useMemo(() => {
    const grupos = new Map(
      (radar.pontos ?? []).map((ponto) => [
        String(ponto.codigo ?? ""),
        { ponto, onibus: [] },
      ]),
    );
    for (const onibus of radar.onibus ?? []) {
      const codigoPonto = String(onibus.codigoParada ?? "");
      if (!grupos.has(codigoPonto)) {
        grupos.set(codigoPonto, {
          ponto: { codigo: codigoPonto || null, nome: null, posicao: null },
          onibus: [],
        });
      }
      grupos.get(codigoPonto).onibus.push(onibus);
    }
    return [...grupos.values()];
  }, [radar.pontos, radar.onibus]);

  useEffect(() => {
    setIndicePontoRodizio(0);
    indicePontoRodizioRef.current = 0;
    setPontoComCodigoVisivel(null);
    setSegundosParaProximoPonto(INTERVALO_RODIZIO_SEGUNDOS);
    if (modoVisualizacao !== "rodizio" || onibusPorPonto.length < 2) return undefined;
    const inicio = Date.now();
    const atualizarRodizio = () => {
      const decorrido = Date.now() - inicio;
      const ciclos = Math.floor(decorrido / (INTERVALO_RODIZIO_SEGUNDOS * 1000));
      const novoIndice = ciclos % onibusPorPonto.length;
      if (novoIndice !== indicePontoRodizioRef.current) {
        indicePontoRodizioRef.current = novoIndice;
        setPontoComCodigoVisivel(null);
        setIndicePontoRodizio(novoIndice);
      }
      const segundosDecorridos = Math.floor((decorrido % (INTERVALO_RODIZIO_SEGUNDOS * 1000)) / 1000);
      setSegundosParaProximoPonto(INTERVALO_RODIZIO_SEGUNDOS - segundosDecorridos);
    };
    atualizarRodizio();
    const intervalo = setInterval(atualizarRodizio, 250);
    return () => clearInterval(intervalo);
  }, [modoVisualizacao, onibusPorPonto.length]);
  
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
        cor: "bg-destaque",
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
    <div className="overflow-x-auto rounded-2xl bg-superficie p-3 shadow-lg sm:p-6">
      
      {/* Elemento invisível do leitor de tela */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {mensagemVoz}
      </div>

      {/* Interface visual */}
      <div className="mb-3 flex flex-col items-center">
        <div className="relative flex min-h-24 w-full max-w-full flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-center lg:text-left">
          <div className="flex min-w-0 flex-col items-center lg:absolute lg:top-0 lg:left-1/2 lg:w-max lg:-translate-x-1/2 lg:items-center">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-lg font-bold sm:text-xl">{exibicao?.nome}</span>
              <FavoriteStar codigo={codigo} />
            </div>
            <div className="mt-1 flex flex-col items-center gap-2 text-sm">
              <span className="font-roboto-mono italic">Código: {codigo}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-borda px-2 py-1 text-xs font-semibold text-texto-suave transition hover:bg-superficie-alt"
                  aria-label="Copiar código da exibição"
                >
                  <Copy size={14} aria-hidden="true" />
                  Copiar
                </button>
                <button
                  type="button"
                  onClick={compartilhar}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-borda px-2 py-1 text-xs font-semibold text-texto-suave transition hover:bg-superficie-alt"
                  aria-label="Compartilhar exibição"
                >
                  <Share2 size={14} aria-hidden="true" />
                  Compartilhar
                </button>
              </div>
            </div>
          </div>
          <div className="w-full lg:absolute lg:top-0 lg:right-0 lg:w-[min(36%,32rem)]">
            <EventosProximos />
          </div>
        </div>
        <InlineToast key={mensagemAcao?.id} mensagem={mensagemAcao} />
        {podeVerDetalhesTecnicos && debugAberto && radar.pontos.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-texto-mudo flex-col">
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
        {podeVerDetalhesTecnicos && <button type="button" onClick={() => setDebugAberto((aberto) => !aberto)} className="mt-1 text-xs text-texto-desabilitado underline hover:text-texto-suave">Detalhes técnicos</button>}
      </div>
      {podeVerDetalhesTecnicos && <VisaoDesenvolvedor
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
      />}
      
      {mostrarSemParadas && (
        <p role="status" className="mb-3 text-center text-sm text-erro">
          {erroExibicao
            ? `Não foi possível carregar a exibição: ${erroExibicao}`
            : "Esta exibição não tem pontos de parada cadastrados."}
        </p>
      )}
      {radar.erro && (
        <p role="status" className="mb-3 text-center text-sm text-erro">
          Não foi possível atualizar o radar: {radar.erro}
        </p>
      )}
      {!radar.erro && !mostrarSemParadas && (
        <p role="status" className="mb-3 text-center text-sm text-texto-mudo">
          {radar.estadoConexao === "iniciando" ? "Conectando ao radar..." : `Radar ${radar.estadoConexao}.`}
        </p>
      )}
      {modoVisualizacao === "completa" ? (
        <ExibicaoTable
          onibus={radar?.onibus ?? []}
          detalhesTecnicos={debugAberto}
          controleEsquerdo={controleModoVisualizacao}
        />
      ) : modoVisualizacao === "por-ponto" ? (
        <div>
          <div className="mb-4 flex justify-center" role="group" aria-label="Modo de exibição dos ônibus">
            {controleModoVisualizacao}
          </div>
          <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-2">
          {onibusPorPonto.map(({ ponto, onibus }, indice) => {
            const codigo = ponto.codigo ?? "—";
            const codigoVisivel = pontoComCodigoVisivel === codigo;
            return (
            <section key={codigo} className="min-w-0 overflow-hidden rounded-xl border border-borda bg-superficie-alt p-3 sm:p-4">
              <button
                type="button"
                onClick={() => setPontoComCodigoVisivel(codigoVisivel ? null : codigo)}
                aria-expanded={codigoVisivel}
                className="mb-3 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-base font-bold hover:text-acento sm:text-lg"
                title="Mostrar código do ponto"
              >
                <span>Ponto {indice + 1}</span>
                {codigoVisivel && <span className="font-roboto-mono text-sm font-normal sm:text-base">({codigo})</span>}
              </button>
              <ExibicaoTable onibus={onibus} detalhesTecnicos={debugAberto} compacto />
            </section>
            );
          })}
          {!onibusPorPonto.length && (
            <p className="py-6 text-center text-texto-mudo">Nenhum ponto cadastrado.</p>
          )}
          </div>
        </div>
      ) : (
        <div className="min-w-0">
          <div className="mb-4 flex justify-center" role="group" aria-label="Modo de exibição dos ônibus">
            {controleModoVisualizacao}
          </div>
          {onibusPorPonto.length > 1 && (
            <div className="mx-auto mb-4 max-w-xl" role="status" aria-live="polite">
              <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-texto-mudo sm:text-sm">
                <span>Próximo ponto em {segundosParaProximoPonto}s</span>
                <span>Ponto {indicePontoRodizio + 1} de {onibusPorPonto.length}</span>
              </div>
              <div
                className="relative h-9 overflow-hidden rounded-full border border-borda bg-superficie-alt px-3"
                role="progressbar"
                aria-label="Tempo até o próximo ponto"
                aria-valuemin="0"
                aria-valuemax={INTERVALO_RODIZIO_SEGUNDOS}
                aria-valuenow={INTERVALO_RODIZIO_SEGUNDOS - segundosParaProximoPonto}
              >
                <div
                  className="absolute inset-x-3 top-1/2 flex h-3 -translate-y-1/2 items-center justify-between gap-1"
                  aria-hidden="true"
                >
                  {Array.from({ length: 18 }, (_, indice) => {
                    const progresso =
                      ((INTERVALO_RODIZIO_SEGUNDOS - segundosParaProximoPonto) /
                        INTERVALO_RODIZIO_SEGUNDOS) *
                      18;
                    return (
                      <span
                        key={indice}
                        className={`h-1 w-full rounded-full transition-colors duration-1000 ${
                          indice < progresso ? "bg-erro" : "bg-texto-mudo/40"
                        }`}
                      />
                    );
                  })}
                </div>
                <BusFront
                  aria-hidden="true"
                  size={25}
                  strokeWidth={2.5}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 fill-yellow-400 text-erro transition-[left] duration-1000 linear"
                  style={{
                    left: `clamp(12.5px, calc(${
                      ((INTERVALO_RODIZIO_SEGUNDOS - segundosParaProximoPonto) /
                        INTERVALO_RODIZIO_SEGUNDOS) *
                      100
                    }% - 12.5px), calc(100% - 12.5px))`,
                  }}
                />
                <MapPin
                  aria-label="Destino: próximo ponto"
                  size={25}
                  strokeWidth={2.5}
                  className="absolute top-1/2 right-0 -translate-y-1/2 fill-superficie text-acento"
                  title="Próximo ponto"
                />
              </div>
            </div>
          )}
          {onibusPorPonto.length ? (() => {
            const indice = indicePontoRodizio % onibusPorPonto.length;
            const { ponto, onibus } = onibusPorPonto[indice];
            const codigo = ponto.codigo ?? "—";
            const codigoVisivel = pontoComCodigoVisivel === codigo;
            return (
              <section className="min-w-0 overflow-hidden rounded-xl border border-borda bg-superficie-alt p-3 sm:p-4">
                <button
                  type="button"
                  onClick={() => setPontoComCodigoVisivel(codigoVisivel ? null : codigo)}
                  aria-expanded={codigoVisivel}
                  className="mb-3 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-base font-bold hover:text-acento sm:text-lg"
                  title="Mostrar código do ponto"
                >
                  <span>Ponto {indice + 1}</span>
                  {codigoVisivel && <span className="font-roboto-mono text-sm font-normal sm:text-base">({codigo})</span>}
                </button>
                <ExibicaoTable onibus={onibus} detalhesTecnicos={debugAberto} compacto />
              </section>
            );
          })() : (
            <p className="py-6 text-center text-texto-mudo">Nenhum ponto cadastrado.</p>
          )}
        </div>
      )}
    </div>
  );
}