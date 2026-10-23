import { normalizarPrevisao } from "../sptrans/normalizar.js";
import { calcularStatus, minutosDoDiaEmSaoPaulo } from "@busca-bus/core";

const LIMITE_OCULTOS = 100;

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
    falhasTotal: 0,
    ultimaFalhaEm: null,
    ultimoErro: null,
    recuperadoEm: null,
    proximaConsultaEm: null,
    consultas: 0,
    ultimaDuracaoMs: null,
    ultimaConsultaEm: null,
    ultimaTentativaEm: null,
    ultimoResultadoQuantidade: 0,
    descartesDuplicados: 0,
    ultimasDuplicatas: 0,
    ultimosDuplicados: [],
    listeners: new Set(),
  };
}

function minutosAtePrevisao(previsao, agora = new Date()) {
  if (typeof previsao !== "string") return null;
  const partes = previsao.match(/^(\d{1,2}):(\d{2})$/);
  if (!partes) return null;
  const destino = Number(partes[1]) * 60 + Number(partes[2]);
  const atual = minutosDoDiaEmSaoPaulo(agora);
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
    atual.ultimaTentativaEm = iniciouEm;
    atual.consultas += 1;
    const promessaConsulta = clienteSptrans.buscarPrevisao(codigoParada)
      .then((resposta) => {
        const normalizado = normalizarPrevisao(resposta, codigoParada);
        atual.descartesDuplicados += normalizado.duplicatas;
        atual.ultimasDuplicatas = normalizado.duplicatas;
        atual.ultimosDuplicados = normalizado.duplicadosDescartados;
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
        if (atual.falhas > 0) atual.recuperadoEm = atual.atualizadoEm;
        atual.erro = null;
        // `falhas` conta só as seguidas (base do recuo exponencial); o histórico fica em falhasTotal e ultimaFalhaEm.
        atual.falhas = 0;
        // A consulta já terminou: quem for notificado não pode enxergar `emAndamento` como verdadeiro.
        atual.emAndamento = null;
        preverProximaConsulta(atual);
        notificar(atual);
        return atual;
      })
      .catch((erro) => {
        atual.erro = erro?.message ?? String(erro);
        atual.falhas += 1;
        atual.falhasTotal += 1;
        atual.ultimaFalhaEm = new Date().toISOString();
        atual.ultimoErro = atual.erro;
        atual.ultimaDuracaoMs = Date.now() - iniciouEm;
        atual.emAndamento = null;
        preverProximaConsulta(atual);
        notificar(atual);
        return atual;
      })
      .finally(() => {
        if (atual.emAndamento === promessaConsulta) atual.emAndamento = null;
      });
    atual.emAndamento = promessaConsulta;
    return promessaConsulta;
  }

  // Sem falhas, as consultas caem numa grade global (múltiplos de `intervaloMs`), em vez de "intervalo depois do fim
  // da anterior". Assim a cadência é exata (sem somar a latência a cada ciclo) e todas as paradas respondem juntas,
  // o que permite à sala publicar um único snapshot por ciclo. Com falha, vale o recuo exponencial.
  function proximoAtraso(atual) {
    if (atual.falhas > 0) return Math.min(intervaloMs * (2 ** (atual.falhas - 1)), 60_000);
    const atraso = intervaloMs - (Date.now() % intervaloMs);
    return atraso < intervaloMs / 2 ? atraso + intervaloMs : atraso;
  }

  // O snapshot sai antes de `agendar` rodar de novo (ele roda depois do `await atualizar`), então sem isto o painel
  // veria o horário da consulta que acabou de terminar. Só vale sem timer pendente; com timer, o horário já é o certo.
  function preverProximaConsulta(atual) {
    if (atual.refs === 0 || atual.timer) return;
    atual.proximaConsultaEm = new Date(Date.now() + proximoAtraso(atual)).toISOString();
  }

  function agendar(atual) {
    if (atual.refs === 0 || atual.timer) return;
    const atraso = proximoAtraso(atual);
    atual.proximaConsultaEm = new Date(Date.now() + atraso).toISOString();
    atual.timer = setTimeout(async () => {
      atual.timer = null;
      await atualizar(atual.codigoParada);
      agendar(atual);
    }, atraso);
  }

  function notificar(atual) {
    // Um listener com defeito não pode impedir os demais nem ser confundido com falha da SPTrans.
    for (const { listener, configuracao } of [...atual.listeners]) {
      try {
        listener(snapshot(atual, configuracao));
      } catch (erro) {
        console.error(`[poller] listener da parada ${atual.codigoParada} falhou:`, erro);
      }
    }
  }

  // O listener recebe exatamente um resultado ao se inscrever: o do cache, se o poller já está rodando e em dia,
  // ou o da consulta que a própria inscrição (ou a que já estava em andamento) dispara.
  function iniciar(codigoParada, listener, configuracao = {}) {
    const atual = estado(codigoParada);
    const emDia = Boolean(atual.timer && !atual.emAndamento && (atual.atualizadoEm || atual.erro));
    atual.refs += 1;
    const inscricao = listener ? { listener, configuracao } : null;
    if (inscricao) atual.listeners.add(inscricao);
    if (!atual.timer) {
      atualizar(codigoParada);
      agendar(atual);
    } else if (inscricao && emDia) {
      queueMicrotask(() => {
        if (atual.listeners.has(inscricao)) listener(snapshot(atual, configuracao));
      });
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

  // Tudo o que foi recebido e não aparece na tela, com o motivo. Só vai no bloco de diagnóstico.
  function listarOcultos(atual, foraDaDistancia, ocultosPorLinha) {
    const prefixo = `${atual.codigoParada}-`;
    const curto = (id) => (String(id).startsWith(prefixo) ? String(id).slice(prefixo.length) : String(id));
    const todos = [
      ...ocultosPorLinha.map(({ item, substituto }) => ({
        motivo: "linha",
        veiculo: curto(item.id),
        linha: item.codigoLetreiro,
        sentido: item.sentidoLinha,
        previsao: item.previsao,
        substituto: { veiculo: curto(substituto.id), previsao: substituto.previsao },
      })),
      ...foraDaDistancia.map(({ item, minutos }) => ({
        motivo: "distancia",
        veiculo: curto(item.id),
        linha: item.codigoLetreiro,
        sentido: item.sentidoLinha,
        previsao: item.previsao,
        minutos,
      })),
      ...atual.ultimosDuplicados.map((item) => ({
        motivo: "duplicata",
        veiculo: curto(item.id),
        linha: item.codigoLetreiro,
        previsao: item.previsao,
      })),
    ];
    return {
      veiculosOcultos: todos.slice(0, LIMITE_OCULTOS),
      veiculosOcultosTruncados: Math.max(0, todos.length - LIMITE_OCULTOS),
    };
  }

  function snapshot(atual, configuracao = {}) {
    const limiteMinutos = Number(configuracao.distanciaMaxMin ?? configuracao.distanciaMinOnibus ?? 20);
    const distanciaMaxima = limiteMinutos * 60;
    const distanciaValida = Number.isFinite(distanciaMaxima) && distanciaMaxima >= 0;
    const onibusDentroDaDistancia = [];
    const foraDaDistancia = [];
    for (const item of atual.onibus) {
      const minutos = minutosAtePrevisao(item.previsao);
      if (distanciaValida && minutos != null && minutos <= limiteMinutos) onibusDentroDaDistancia.push(item);
      else foraDaDistancia.push({ item, minutos });
    }
    const onibus = onibusDentroDaDistancia.map((item) => ({
      ...item,
      status: calcularStatus(item.previsao, atual.promessa.get(item.id), configuracao),
    }));
    // Sem "vários por linha", só o primeiro de cada linha aparece; os demais viram "ocultos" (e o painel os lista).
    const ocultosPorLinha = [];
    let onibusExibidos = onibus;
    if (!configuracao.permitirMultiplosPorLinha) {
      const mantidoPorLinha = new Map();
      onibusExibidos = [];
      for (const item of onibus) {
        const mantido = mantidoPorLinha.get(item.codigoLetreiro);
        if (!mantido) {
          mantidoPorLinha.set(item.codigoLetreiro, item);
          onibusExibidos.push(item);
        } else {
          ocultosPorLinha.push({ motivo: "linha", item, substituto: mantido });
        }
      }
    }
    return {
      codigoParada: atual.codigoParada,
      onibus: onibusExibidos,
      ponto: atual.ponto,
      atualizadoEm: atual.atualizadoEm,
      erro: atual.erro,
      estadoConexao: atual.erro ? "reconectando" : atual.atualizadoEm ? "conectado" : "iniciando",
      diagnostico: {
        consultas: atual.consultas,
        // Acumuladas desde que o servidor subiu; as seguidas zeram na primeira consulta bem-sucedida.
        falhas: atual.falhasTotal,
        falhasSeguidas: atual.falhas,
        ultimaFalhaEm: atual.ultimaFalhaEm,
        ultimoErro: atual.ultimoErro,
        recuperadoEm: atual.recuperadoEm,
        proximaConsultaEm: atual.proximaConsultaEm,
        geradoEm: new Date().toISOString(),
        referenciasAtivas: atual.refs,
        consultaEmAndamento: Boolean(atual.emAndamento),
        ultimaConsultaEm: atual.ultimaConsultaEm,
        ultimaDuracaoMs: atual.ultimaDuracaoMs,
        veiculosNormalizados: atual.ultimoResultadoQuantidade,
        veiculosFiltradosPorDistancia: atual.onibus.length - onibusDentroDaDistancia.length,
        distanciaMaxMin: limiteMinutos,
        duplicatasDescartadas: atual.descartesDuplicados,
        veiculosFiltradosPorLinha: onibus.length - onibusExibidos.length,
        veiculosBrutos: atual.ultimoResultadoQuantidade + atual.ultimasDuplicatas,
        veiculosExibidos: onibusExibidos.length,
        ...listarOcultos(atual, foraDaDistancia, ocultosPorLinha),
        permitirMultiplosPorLinha: Boolean(configuracao.permitirMultiplosPorLinha),
        sptrans: clienteSptrans.diagnostico?.() ?? null,
      },
    };
  }

  // Usada por REST e validações. Não força consulta à SPTrans quando o poller já mantém a parada em dia
  // (ou quando a última tentativa é recente), para uma chamada HTTP não virar consulta extra + emissão por socket.
  async function consultar(codigoParada, configuracao = {}) {
    const atual = estado(codigoParada);
    const temResultado = Boolean(atual.atualizadoEm || atual.erro);
    const coberto = atual.refs > 0 && temResultado;
    const recente = Boolean(atual.ultimaTentativaEm) && Date.now() - atual.ultimaTentativaEm < intervaloMs;
    if (!coberto && !recente) await atualizar(codigoParada);
    else if (!temResultado && atual.emAndamento) await atual.emAndamento;
    return snapshot(atual, configuracao);
  }

  return {
    iniciar,
    consultar,
    // Consulta imediata (fora do ciclo): usada pelo painel ao trocar o cenário simulado, para o efeito aparecer já.
    atualizarAgora: (codigoParada) => atualizar(codigoParada),
    snapshot: (codigoParada, configuracao = {}) => snapshot(estado(codigoParada), configuracao),
  };
}
