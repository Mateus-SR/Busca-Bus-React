"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { normalizarOnibus } from "@busca-bus/core";
import { criarClienteApi } from "@busca-bus/core/cliente";
import { EVENTOS_SOCKET } from "@busca-bus/core";

function normalizarLista(onibus) {
  const unicos = new Map();
  for (const item of onibus) {
    const normalizado = normalizarOnibus(item);
    if (normalizado.id != null) unicos.set(String(normalizado.id), normalizado);
  }
  return [...unicos.values()];
}

const OPCOES_PADRAO = {};

// Tamanho do snapshot como o servidor o conta: sem o bloco de diagnóstico, que só existe com o painel aberto.
function tamanhoSemDiagnostico(resposta) {
  const texto = JSON.stringify(resposta, (chave, valor) => (chave === "diagnostico" ? undefined : valor));
  return new TextEncoder().encode(texto).byteLength;
}

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
  // Registro das quedas e reconexões do navegador: vive no hook, então sobrevive às reconexões do socket.
  const [eventosConexao, setEventosConexao] = useState([]);
  const [conexao, setConexao] = useState({
    reconexoes: 0,
    desconexoes: 0,
    ultimaDesconexaoEm: null,
    ultimaReconexaoEm: null,
    fallbackRest: false,
  });
  const metricasRef = useRef({ sequencia: 0, respostasDescartadas: 0, snapshotBytesAtual: 0, snapshotBytesTotal: 0, veiculosRenderizados: 0 });
  const cicloOnibusRef = useRef({ idsConhecidos: new Set(), idsAusentes: new Set(), inicializado: false });
  const socketRef = useRef(null);
  // Opções e painel aberto/fechado são lidos por ref: mudar qualquer um deles não pode derrubar e recriar o socket.
  const opcoesRef = useRef(opcoes);
  const diagnosticoAtivoRef = useRef(diagnosticoAtivo);
  useEffect(() => {
    opcoesRef.current = opcoes;
  }, [opcoes]);
  // O diagnóstico é por navegador: o servidor só inclui o bloco nos snapshots de quem está com o painel aberto.
  useEffect(() => {
    diagnosticoAtivoRef.current = diagnosticoAtivo;
    const socket = socketRef.current;
    if (socket?.connected) socket.emit(EVENTOS_SOCKET.DIAGNOSTICO, { codigo, ativo: diagnosticoAtivo });
  }, [codigo, diagnosticoAtivo]);
  // Só uma mudança real de paradas justifica reentrar na sala; um objeto novo com o mesmo conteúdo não.
  const chaveParadas = JSON.stringify(opcoes.paradas?.length ? opcoes.paradas : [opcoes.parada ?? null]);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      const intervaloFixture = setInterval(() => setOnibus((atuais) => atuais.map((item) => ({ ...item }))), 5000);
      return () => clearInterval(intervaloFixture);
    }
    let ativo = true;
    let atualizacao = 0;
    let fallbackAtivo = false;
    let intervaloFallback = null;
    let jaConectou = false;
    const registrarConexao = (tipo, detalhe = null) => {
      setEventosConexao((historico) => [{ tipo, detalhe, em: new Date().toISOString() }, ...historico].slice(0, 30));
    };
    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    const cliente = criarClienteApi(process.env.NEXT_PUBLIC_API_URL);
    function aplicarResposta(resposta, iniciouEm, origem) {
      if (!ativo) return;
      const snapshotBytesAtual = tamanhoSemDiagnostico(resposta);
      metricasRef.current.snapshotBytesAtual = snapshotBytesAtual;
      metricasRef.current.snapshotBytesTotal += snapshotBytesAtual;
      metricasRef.current.sequencia += 1;
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
      metricasRef.current.veiculosRenderizados = lista.length;
      setOnibus(lista);
      setAtualizadoEm(resposta.atualizadoEm ?? new Date().toISOString());
      setPonto(resposta.ponto ?? null);
      setPontos(resposta.pontos ?? (resposta.ponto ? [resposta.ponto] : []));
      setConfiguracaoServidor(resposta.configuracao ?? null);
      setEstadoConexao(origem === "socket" ? "conectado" : (resposta.estadoConexao ?? "reconectando"));
      setErro(resposta.erro ?? null);
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
              veiculosRenderizados: lista.length,
              snapshotBytesAtual: metricasRef.current.snapshotBytesAtual,
              snapshotBytesTotal: metricasRef.current.snapshotBytesTotal,
              origem,
            },
          }
        : null;
      if (diagnosticoAtual) {
        setDiagnostico(diagnosticoAtual);
        setHistoricoDiagnostico((historico) => [...historico, diagnosticoAtual].slice(-30));
      } else if (!diagnosticoAtivoRef.current) {
        setDiagnostico(null);
      }
    }
    // Só roda com o socket fora do ar. O servidor responde do cache, sem nova consulta à SPTrans.
    async function atualizarRest() {
      const numeroAtualizacao = ++atualizacao;
      const iniciouEm = performance.now();
      try {
        const resposta = await cliente.obterRadar(codigo, {
          diagnostico: diagnosticoAtivoRef.current,
          permitirMultiplosPorLinha: opcoesRef.current.config?.permitirMultiplosPorLinha,
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
    function ativarFallback() {
      if (!ativo || fallbackAtivo) return;
      fallbackAtivo = true;
      registrarConexao("fallback REST ativado");
      setConexao((atual) => ({ ...atual, fallbackRest: true }));
      atualizarRest();
      intervaloFallback = setInterval(atualizarRest, 10_000);
    }
    function desativarFallback() {
      if (fallbackAtivo && ativo) {
        registrarConexao("fallback REST desativado");
        setConexao((atual) => ({ ...atual, fallbackRest: false }));
      }
      fallbackAtivo = false;
      if (intervaloFallback) clearInterval(intervaloFallback);
      intervaloFallback = null;
    }
    socket.on("connect", () => {
      if (!ativo) return;
      const reconexao = jaConectou;
      jaConectou = true;
      registrarConexao(reconexao ? "reconectado" : "conectado");
      if (reconexao) {
        setConexao((atual) => ({ ...atual, reconexoes: atual.reconexoes + 1, ultimaReconexaoEm: new Date().toISOString() }));
      }
      desativarFallback();
      setEstadoConexao("conectando");
      const { parada, paradas, config } = opcoesRef.current;
      socket.emit(EVENTOS_SOCKET.ENTRAR, {
        codigo,
        parada,
        paradas,
        config,
        diagnostico: diagnosticoAtivoRef.current,
      }, (resposta) => {
        if (!ativo || resposta?.ok) return;
        setErro(resposta?.erro || "Não foi possível entrar na exibição.");
        ativarFallback();
      });
    });
    socket.on(EVENTOS_SOCKET.SNAPSHOT, (resposta) => aplicarResposta(resposta, performance.now(), "socket"));
    socket.on(EVENTOS_SOCKET.AVISO, (aviso) => {
      if (ativo) registrarConexao("aviso do servidor", aviso?.mensagem ?? aviso?.tipo ?? null);
    });
    socket.on("connect_error", (erroSocket) => {
      if (!ativo) return;
      registrarConexao("erro de conexão", erroSocket.message);
      setErro(erroSocket.message);
      setEstadoConexao("reconectando");
      ativarFallback();
    });
    socket.on("disconnect", (motivo) => {
      if (!ativo) return;
      registrarConexao("desconectado", motivo);
      setConexao((atual) => ({ ...atual, desconexoes: atual.desconexoes + 1, ultimaDesconexaoEm: new Date().toISOString() }));
      setEstadoConexao("reconectando");
      setErro(`Socket.IO desconectado: ${motivo}`);
      ativarFallback();
    });
    socket.connect();
    return () => {
      ativo = false;
      cicloOnibusRef.current = { idsConhecidos: new Set(), idsAusentes: new Set(), inicializado: false };
      desativarFallback();
      // Sem isto, o `disconnect` disparado por socket.disconnect() abaixo reativaria o fallback e ele nunca mais seria limpo.
      socket.removeAllListeners();
      if (socket.connected) socket.emit(EVENTOS_SOCKET.SAIR, { codigo });
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [codigo, atualizacaoSolicitada, chaveParadas]);
  return {
    onibus, atualizadoEm, ponto, pontos, configuracao: configuracaoServidor, exibicaoDesde: null, estadoConexao,
    carregando: estadoConexao === "iniciando", erro, diagnostico, historicoDiagnostico, eventosOnibus,
    conexao, eventosConexao,
    limparDiagnostico: () => {
      setHistoricoDiagnostico([]);
      setEventosOnibus([]);
      setEventosConexao([]);
    },
    // Cenários de falha (simulação) e queda do socket, pelo painel. Responde { ok, simulacao?, erro? }.
    simular: useCallback((cenario, duracaoSeg) => new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket?.connected) return resolve({ ok: false, erro: "Socket desconectado." });
      socket.timeout(5000).emit(EVENTOS_SOCKET.SIMULAR, { codigo, cenario, duracaoSeg }, (erroTempo, resposta) => {
        resolve(erroTempo ? { ok: false, erro: "Sem resposta do servidor." } : (resposta ?? { ok: false, erro: "Sem resposta." }));
      });
    }), [codigo]),
    configurar: useCallback((configuracao) => {
      socketRef.current?.emit(EVENTOS_SOCKET.CONFIGURAR, { codigo, config: configuracao });
    }, [codigo]),
  };
}
