"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { normalizarOnibus } from "@busca-bus/core";
import { criarClienteApi } from "@busca-bus/core/cliente";
import { EVENTOS_SOCKET, INTERVALO_COLETA_MS } from "@busca-bus/core";

function normalizarLista(onibus) {
  const unicos = new Map();
  for (const item of onibus) {
    const normalizado = normalizarOnibus(item);
    if (normalizado.id != null) unicos.set(String(normalizado.id), normalizado);
  }
  return [...unicos.values()];
}

const OPCOES_PADRAO = {};

export default function useRadarOnibus(codigo, onibusIniciais = [], diagnosticoAtivo = false, atualizacaoSolicitada = 0, opcoes = OPCOES_PADRAO) {
  const [onibus, setOnibus] = useState(() => normalizarLista(onibusIniciais));
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [ponto, setPonto] = useState(null);
  const [pontos, setPontos] = useState([]);
  const [configuracaoServidor, setConfiguracaoServidor] = useState(null);
  const [estadoConexao, setEstadoConexao] = useState(process.env.NEXT_PUBLIC_API_URL ? "iniciando" : "conectado");
  const [erro, setErro] = useState(null);
  const [diagnostico, setDiagnostico] = useState(null);
  const [historicoDiagnostico, setHistoricoDiagnostico] = useState([]);
  const [eventosOnibus, setEventosOnibus] = useState([]);
  const metricasRef = useRef({ sequencia: 0, respostasDescartadas: 0, snapshotBytesAtual: 0, snapshotBytesTotal: 0, veiculosRenderizados: 0 });
  const cicloOnibusRef = useRef({ idsConhecidos: new Set(), idsAusentes: new Set(), inicializado: false });
  const [diagnosticoSocketAtivo, setDiagnosticoSocketAtivo] = useState(false);
  const diagnosticoSocketRef = useRef(false);
  const socketRef = useRef(null);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      const intervaloFixture = setInterval(() => setOnibus((atuais) => atuais.map((item) => ({ ...item }))), 5000);
      return () => clearInterval(intervaloFixture);
    }
    let ativo = true;
    let atualizacao = 0;
    let fallbackAtivo = false;
    let intervaloFallback = null;
    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    const cliente = criarClienteApi(process.env.NEXT_PUBLIC_API_URL);
    function aplicarResposta(resposta, iniciouEm, origem, atualizarDados = true) {
      if (!ativo) return;
      // Só snapshots reais entram na contagem; a busca REST só do diagnóstico traz sempre o diagnóstico completo
      // e distorceria o tamanho que o socket realmente entrega.
      if (atualizarDados) {
        const snapshotBytesAtual = new TextEncoder().encode(JSON.stringify(resposta)).byteLength;
        metricasRef.current.snapshotBytesAtual = snapshotBytesAtual;
        metricasRef.current.snapshotBytesTotal += snapshotBytesAtual;
        metricasRef.current.sequencia += 1;
      }
      const lista = normalizarLista(resposta.onibus ?? []);
      const idsAtuais = new Set(lista.map((item) => String(item.id)));
      const ciclo = cicloOnibusRef.current;
      const eventos = [];
      if (ciclo.inicializado) {
        for (const anterior of ciclo.idsConhecidos) {
          if (!idsAtuais.has(anterior)) {
            ciclo.idsAusentes.add(anterior);
            eventos.push({ tipo: "saida", id: anterior, em: new Date().toISOString() });
          }
        }
      }
      for (const item of lista) {
        const id = String(item.id);
        if (!ciclo.idsConhecidos.has(id)) {
          eventos.push({
            tipo: ciclo.idsAusentes.has(id) ? "redetectado" : "novo",
            id,
            linha: item.codigoLetreiro,
            previsao: item.previsao,
            em: new Date().toISOString(),
          });
          ciclo.idsAusentes.delete(id);
        }
      }
      ciclo.idsConhecidos = idsAtuais;
      ciclo.inicializado = true;
      if (eventos.length) setEventosOnibus((historico) => [...eventos, ...historico].slice(0, 30));
      if (atualizarDados) {
        metricasRef.current.veiculosRenderizados = lista.length;
        setOnibus(lista);
        setAtualizadoEm(resposta.atualizadoEm ?? new Date().toISOString());
        setPonto(resposta.ponto ?? null);
        setPontos(resposta.pontos ?? (resposta.ponto ? [resposta.ponto] : []));
        setConfiguracaoServidor(resposta.configuracao ?? null);
        setEstadoConexao(origem === "socket" ? "conectado" : (resposta.estadoConexao ?? "reconectando"));
        setErro(resposta.erro ?? null);
      }
      const diagnosticoBase = resposta.diagnostico
        ? (resposta.diagnostico.paradas
          ? resposta.diagnostico
          : {
              paradas: [resposta.diagnostico],
              socket: resposta.diagnostico.socket ?? null,
              recebidoEm: resposta.atualizadoEm ?? new Date().toISOString(),
            })
        : null;
      const diagnosticoAtual = diagnosticoBase
        ? {
            ...diagnosticoBase,
            socket: diagnosticoBase.socket ?? resposta.diagnosticoSocket ?? null,
            frontend: {
              sequencia: metricasRef.current.sequencia,
              respostasDescartadas: metricasRef.current.respostasDescartadas,
              duracaoMs: Math.round(performance.now() - iniciouEm),
              veiculosRenderizados: atualizarDados ? lista.length : metricasRef.current.veiculosRenderizados,
              snapshotBytesAtual: metricasRef.current.snapshotBytesAtual,
              snapshotBytesTotal: metricasRef.current.snapshotBytesTotal,
              origem,
            },
          }
        : null;
      if (diagnosticoAtual) {
        setDiagnostico(diagnosticoAtual);
        setHistoricoDiagnostico((historico) => [...historico, diagnosticoAtual].slice(-30));
      } else if (!diagnosticoAtivo) {
        setDiagnostico(null);
      }
    }
    async function atualizarRest() {
      const numeroAtualizacao = ++atualizacao;
      const iniciouEm = performance.now();
      try {
        const resposta = await cliente.obterRadar(codigo, {
          diagnostico: diagnosticoAtivo,
          permitirMultiplosPorLinha: opcoes.config?.permitirMultiplosPorLinha,
        });
        if (!ativo || numeroAtualizacao !== atualizacao) {
          metricasRef.current.respostasDescartadas += 1;
          return;
        }
        aplicarResposta(resposta, iniciouEm, "rest");
      } catch (erroApi) {
        if (!ativo || numeroAtualizacao !== atualizacao) return;
        setEstadoConexao("reconectando");
        setErro(erroApi.message);
      }
    }
    // Com a sincronização ligada o diagnóstico chega pelo socket; desligada, é buscado só para esta tela.
    async function atualizarDiagnosticoRest() {
      if (!diagnosticoAtivo || diagnosticoSocketRef.current) return;
      const iniciouEm = performance.now();
      try {
        const resposta = await cliente.obterRadar(codigo, {
          diagnostico: true,
          permitirMultiplosPorLinha: opcoes.config?.permitirMultiplosPorLinha,
        });
        if (ativo) aplicarResposta(resposta, iniciouEm, "rest-diagnostico", false);
      } catch {
        if (ativo) setDiagnostico((atual) => atual ?? null);
      }
    }
    let intervaloDiagnostico = null;
    if (diagnosticoAtivo) {
      atualizarDiagnosticoRest();
      intervaloDiagnostico = setInterval(atualizarDiagnosticoRest, INTERVALO_COLETA_MS);
    }
    function ativarFallback() {
      if (fallbackAtivo) return;
      fallbackAtivo = true;
      atualizarRest();
      intervaloFallback = setInterval(atualizarRest, 10_000);
    }
    function desativarFallback() {
      fallbackAtivo = false;
      if (intervaloFallback) clearInterval(intervaloFallback);
      intervaloFallback = null;
    }
    socket.on("connect", () => {
      desativarFallback();
      setEstadoConexao("conectando");
      socket.emit(EVENTOS_SOCKET.ENTRAR, {
        codigo,
        parada: opcoes.parada,
        paradas: opcoes.paradas,
        config: opcoes.config,
      }, (resposta) => {
        if (!resposta?.ok) {
          setErro(resposta?.erro || "Não foi possível entrar na exibição.");
          ativarFallback();
          return;
        }
        definirDiagnosticoSocket(Boolean(resposta.diagnosticoSocket));
      });
    });
    function definirDiagnosticoSocket(ativoSala) {
      diagnosticoSocketRef.current = ativoSala;
      setDiagnosticoSocketAtivo(ativoSala);
      if (!ativoSala) atualizarDiagnosticoRest();
    }
    socket.on(EVENTOS_SOCKET.DIAGNOSTICO, (payload) => definirDiagnosticoSocket(Boolean(payload?.ativo)));
    socket.on(EVENTOS_SOCKET.SNAPSHOT, (resposta) => aplicarResposta(resposta, performance.now(), "socket"));
    socket.on("connect_error", (erroSocket) => {
      setErro(erroSocket.message);
      setEstadoConexao("reconectando");
      ativarFallback();
    });
    socket.on("disconnect", (motivo) => {
      setEstadoConexao("reconectando");
      setErro(`Socket.IO desconectado: ${motivo}`);
      ativarFallback();
    });
    socket.connect();
    return () => {
      ativo = false;
      cicloOnibusRef.current = { idsConhecidos: new Set(), idsAusentes: new Set(), inicializado: false };
      desativarFallback();
      socket.emit(EVENTOS_SOCKET.SAIR, { codigo });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [codigo, diagnosticoAtivo, atualizacaoSolicitada, opcoes.parada, opcoes.paradas, opcoes.config]);
  return {
    onibus, atualizadoEm, ponto, pontos, configuracao: configuracaoServidor, exibicaoDesde: null, estadoConexao,
    carregando: estadoConexao === "iniciando", erro, diagnostico, diagnosticoSocketAtivo, historicoDiagnostico, eventosOnibus,
    limparDiagnostico: () => {
      setHistoricoDiagnostico([]);
      setEventosOnibus([]);
    },
    configurar: useCallback((configuracao) => {
      socketRef.current?.emit(EVENTOS_SOCKET.CONFIGURAR, { codigo, config: configuracao });
    }, [codigo]),
    configurarDiagnosticoSocket: useCallback((ativo) => {
      socketRef.current?.emit(EVENTOS_SOCKET.DIAGNOSTICO, { codigo, ativo });
    }, [codigo]),
  };
}
