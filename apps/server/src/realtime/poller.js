import { normalizarPrevisao } from "../sptrans/normalizar.js";
import { calcularStatus } from "@busca-bus/core";

function criarEstado(codigoParada) {
  return {
    codigoParada,
    refs: 0,
    onibus: [],
    ponto: null,
    atualizadoEm: null,
    erro: null,
    promessa: new Map(),
    emAndamento: null,
    timer: null,
    falhas: 0,
    consultas: 0,
    ultimaDuracaoMs: null,
    ultimaConsultaEm: null,
    ultimoResultadoQuantidade: 0,
    descartesDuplicados: 0,
    listeners: new Set(),
  };
}

function minutosAtePrevisao(previsao, agora = new Date()) {
  if (typeof previsao !== "string") return null;
  const partes = previsao.match(/^(\d{1,2}):(\d{2})$/);
  if (!partes) return null;
  const destino = Number(partes[1]) * 60 + Number(partes[2]);
  const atual = agora.getHours() * 60 + agora.getMinutes();
  const diferenca = destino - atual;
  if (diferenca >= 0) return diferenca;
  return diferenca < -720 ? diferenca + 1440 : null;
}

export function criarPoller({ clienteSptrans, intervaloMs }) {
  const estados = new Map();

  function estado(codigoParada) {
    if (!estados.has(codigoParada)) estados.set(codigoParada, criarEstado(codigoParada));
    return estados.get(codigoParada);
  }

  async function atualizar(codigoParada) {
    const atual = estado(codigoParada);
    if (atual.emAndamento) return atual.emAndamento;
    const iniciouEm = Date.now();
    atual.consultas += 1;
    atual.emAndamento = clienteSptrans.buscarPrevisao(codigoParada)
      .then((resposta) => {
        const normalizado = normalizarPrevisao(resposta, codigoParada);
        atual.descartesDuplicados += normalizado.duplicatas;
        atual.ultimoResultadoQuantidade = normalizado.onibus.length;
        const idsAtuais = new Set(normalizado.onibus.map((item) => item.id));
        for (const id of atual.promessa.keys()) {
          if (!idsAtuais.has(id)) atual.promessa.delete(id);
        }
        atual.onibus = normalizado.onibus.map((item) => {
          const promessa = atual.promessa.get(item.id) || item.previsao;
          atual.promessa.set(item.id, promessa);
          return { ...item, promessa };
        });
        atual.ponto = normalizado.ponto;
        atual.atualizadoEm = new Date().toISOString();
        atual.ultimaConsultaEm = atual.atualizadoEm;
        atual.ultimaDuracaoMs = Date.now() - iniciouEm;
        atual.erro = null;
        atual.falhas = 0;
        notificar(atual);
        return atual;
      })
      .catch((erro) => {
        atual.erro = erro.message;
        atual.falhas += 1;
        atual.ultimaDuracaoMs = Date.now() - iniciouEm;
        notificar(atual);
        return atual;
      })
      .finally(() => { atual.emAndamento = null; });
    return atual.emAndamento;
  }

  function agendar(atual) {
    if (atual.refs === 0 || atual.timer) return;
    const atraso = Math.min(intervaloMs * (2 ** Math.max(0, atual.falhas - 1)), 60_000);
    atual.timer = setTimeout(async () => {
      atual.timer = null;
      await atualizar(atual.codigoParada);
      agendar(atual);
    }, atraso);
  }

  function notificar(atual) {
    for (const { listener, configuracao } of atual.listeners) listener(snapshot(atual, configuracao));
  }

  function iniciar(codigoParada, listener, configuracao = {}) {
    const atual = estado(codigoParada);
    atual.refs += 1;
    const inscricao = listener ? { listener, configuracao } : null;
    if (inscricao) atual.listeners.add(inscricao);
    if (!atual.timer) {
      atualizar(codigoParada);
      agendar(atual);
    }
    return () => {
      if (inscricao) atual.listeners.delete(inscricao);
      atual.refs = Math.max(0, atual.refs - 1);
      if (atual.refs === 0 && atual.timer) {
        clearTimeout(atual.timer);
        atual.timer = null;
      }
    };
  }

  function snapshot(atual, configuracao = {}) {
    const limiteMinutos = Number(configuracao.distanciaMaxMin ?? configuracao.distanciaMinOnibus ?? 20);
    const distanciaMaxima = limiteMinutos * 60;
    const onibusDentroDaDistancia = Number.isFinite(distanciaMaxima) && distanciaMaxima >= 0
      ? atual.onibus.filter((item) => {
          const minutos = minutosAtePrevisao(item.previsao);
          return minutos != null && minutos <= limiteMinutos;
        })
      : [];
    const onibus = onibusDentroDaDistancia.map((item) => ({
      ...item,
      status: calcularStatus(item.previsao, atual.promessa.get(item.id), configuracao),
    }));
    const onibusExibidos = configuracao.permitirMultiplosPorLinha
      ? onibus
      : [...onibus.reduce((porLinha, item) => {
          if (!porLinha.has(item.codigoLetreiro)) porLinha.set(item.codigoLetreiro, item);
          return porLinha;
        }, new Map()).values()];
    return {
      codigoParada: atual.codigoParada,
      onibus: onibusExibidos,
      ponto: atual.ponto,
      atualizadoEm: atual.atualizadoEm,
      erro: atual.erro,
      estadoConexao: atual.erro ? "reconectando" : atual.atualizadoEm ? "conectado" : "iniciando",
      diagnostico: {
        consultas: atual.consultas,
        falhas: atual.falhas,
        referenciasAtivas: atual.refs,
        consultaEmAndamento: Boolean(atual.emAndamento),
        ultimaConsultaEm: atual.ultimaConsultaEm,
        ultimaDuracaoMs: atual.ultimaDuracaoMs,
        veiculosNormalizados: atual.ultimoResultadoQuantidade,
        veiculosFiltradosPorDistancia: atual.onibus.length - onibusDentroDaDistancia.length,
        distanciaMaxMin: limiteMinutos,
        duplicatasDescartadas: atual.descartesDuplicados,
        veiculosFiltradosPorLinha: onibus.length - onibusExibidos.length,
        permitirMultiplosPorLinha: Boolean(configuracao.permitirMultiplosPorLinha),
        sptrans: clienteSptrans.diagnostico?.() ?? null,
      },
    };
  }

  async function consultar(codigoParada, configuracao = {}) {
    const atual = estado(codigoParada);
    await atualizar(codigoParada);
    return snapshot(atual, configuracao);
  }

  return {
    iniciar,
    consultar,
    snapshot: (codigoParada, configuracao = {}) => snapshot(estado(codigoParada), configuracao),
  };
}
