import { Server } from "socket.io";
import { EVENTOS_SOCKET } from "@busca-bus/core";

const CONFIG_PADRAO = {
  tempoAtraso: 2,
  tempoAdiantado: 2,
  distanciaMaxMin: 20,
  permitirMultiplosPorLinha: false,
};
// Faixas aceitas para os valores numéricos vindos do cliente; fora delas o valor é ignorado.
const LIMITES_CONFIG = {
  tempoAtraso: [0, 120],
  tempoAdiantado: [0, 120],
  distanciaMaxMin: [0, 180],
};
const MAX_PARADAS = 8;
const JANELA_COALESCING_PADRAO_MS = 500;
const MAX_EVENTOS_POR_JANELA = 30;
const JANELA_EVENTOS_MS = 10_000;

function numeroNaFaixa(valor, [minimo, maximo]) {
  if (valor === null || valor === undefined || valor === "" || typeof valor === "boolean") return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= minimo && numero <= maximo ? numero : undefined;
}

// Só campos conhecidos, com tipo e faixa válidos. O resto do objeto do cliente é descartado.
export function sanearConfiguracao(entrada, base = CONFIG_PADRAO) {
  const origem = entrada && typeof entrada === "object" ? entrada : {};
  const lido = {
    tempoAtraso: origem.tempoAtraso ?? origem.tempo_atraso,
    tempoAdiantado: origem.tempoAdiantado ?? origem.tempo_adiantado,
    distanciaMaxMin: origem.distanciaMaxMin ?? origem.distanciaMinOnibus,
  };
  const resultado = { ...base };
  for (const [campo, faixa] of Object.entries(LIMITES_CONFIG)) {
    const numero = numeroNaFaixa(lido[campo], faixa);
    if (numero !== undefined) resultado[campo] = numero;
  }
  const multiplos = origem.permitirMultiplosPorLinha ?? origem.permitir_multiplos_por_linha;
  if (typeof multiplos === "boolean") resultado.permitirMultiplosPorLinha = multiplos;
  return resultado;
}

function responder(ack, dados) {
  if (typeof ack === "function") ack(dados);
}

function criarLimitador() {
  let inicioJanela = Date.now();
  let contagem = 0;
  return () => {
    const agora = Date.now();
    if (agora - inicioJanela > JANELA_EVENTOS_MS) {
      inicioJanela = agora;
      contagem = 0;
    }
    contagem += 1;
    return contagem <= MAX_EVENTOS_POR_JANELA;
  };
}

// Resposta sem o bloco de diagnóstico: é o tamanho "de produção" contado nas métricas.
function montarResposta(codigo, lista, configuracao) {
  return {
    codigo,
    configuracao: {
      tempoAtraso: configuracao.tempoAtraso,
      tempoAdiantado: configuracao.tempoAdiantado,
      distanciaMaxMin: configuracao.distanciaMaxMin,
      permitirMultiplosPorLinha: Boolean(configuracao.permitirMultiplosPorLinha),
    },
    atualizadoEm: lista.map((item) => item.atualizadoEm).filter(Boolean).sort().at(-1) || null,
    estadoConexao: lista.some((item) => item.estadoConexao === "conectado") ? "conectado" : "reconectando",
    erro: lista.find((item) => item.erro)?.erro || null,
    paradas: lista.map((item) => item.codigoParada),
    pontos: lista.map((item) => item.ponto).filter(Boolean),
    ponto: lista.find((item) => item.ponto)?.ponto || null,
    onibus: lista.flatMap((item) => item.onibus.map((onibus) => ({ ...onibus, codigoParada: item.codigoParada }))),
  };
}

export function createSocketServer(httpServer, config, poller, simulador = null) {
  const metricas = {
    conectados: 0,
    totalConexoes: 0,
    entradas: 0,
    saidas: 0,
    snapshotsEnviados: 0,
    snapshotBytesAtual: 0,
    snapshotBytesTotal: 0,
    ultimaConexaoEm: null,
    ultimaDesconexaoEm: null,
  };
  const io = new Server(httpServer, {
    cors: { origin: config.allowedOrigins.length ? config.allowedOrigins : true },
    maxHttpBufferSize: 64 * 1024,
  });
  const salas = new Map();
  // As métricas de uma sala sobrevivem a ela: quando o último cliente cai e volta (queda de rede, recarga), a sala é
  // recriada, mas os contadores continuam de onde estavam em vez de voltar a zero.
  const metricasPorSala = new Map();
  const MAX_SALAS_COM_METRICAS = 100;
  function metricasDaSala(codigo) {
    let registro = metricasPorSala.get(codigo);
    if (!registro) {
      registro = { snapshotsEnviados: 0, snapshotBytesAtual: 0, snapshotBytesTotal: 0, desde: new Date().toISOString() };
      metricasPorSala.set(codigo, registro);
      if (metricasPorSala.size > MAX_SALAS_COM_METRICAS) metricasPorSala.delete(metricasPorSala.keys().next().value);
    }
    return registro;
  }
  const janelaMs = Number.isFinite(config.coalescingMs) && config.coalescingMs >= 0
    ? config.coalescingMs
    : JANELA_COALESCING_PADRAO_MS;
  io.on("connection", (socket) => {
    metricas.conectados += 1;
    metricas.totalConexoes += 1;
    metricas.ultimaConexaoEm = new Date().toISOString();
    const assinaturas = new Map();
    const permitido = criarLimitador();
    // Um payload malformado nunca pode virar exceção não tratada (derrubaria o processo inteiro).
    const escutar = (evento, tratador) => socket.on(evento, (...argumentos) => {
      try {
        tratador(...argumentos);
      } catch (erro) {
        console.error(`[socket] erro em ${evento}:`, erro);
        responder(argumentos.at(-1), { ok: false, erro: "Requisição inválida." });
      }
    });

    escutar(EVENTOS_SOCKET.ENTRAR, (payload, ack) => {
      if (!permitido()) return responder(ack, { ok: false, erro: "Muitas requisições." });
      const dados = payload && typeof payload === "object" ? payload : {};
      const codigo = String(dados.codigo ?? "");
      if (!/^[A-Za-z0-9_-]{1,32}$/.test(codigo)) return responder(ack, { ok: false, erro: "Código inválido." });
      const candidatas = Array.isArray(dados.paradas) && dados.paradas.length
        ? dados.paradas
        : [dados.parada || config.testStopCode];
      const paradas = [...new Set(candidatas.map((item) => String(item)).filter((item) => /^\d{7,9}$/.test(item)))]
        .slice(0, MAX_PARADAS);
      if (!paradas.length) return responder(ack, { ok: false, erro: "Código de parada inválido." });
      sairDaSala(socket, codigo);
      metricas.entradas += 1;
      socket.join(`exibicao:${codigo}`);
      let sala = salas.get(codigo);
      if (!sala) {
        // A configuração da sala nasce do primeiro cliente; depois só muda por `configurar`.
        sala = {
          configuracao: sanearConfiguracao(dados.config),
          assinaturas: new Map(),
          metricas: metricasDaSala(codigo),
        };
        salas.set(codigo, sala);
      }
      iniciarAssinatura(socket, codigo, paradas, sala, Boolean(dados.diagnostico));
      return responder(ack, { ok: true });
    });
    // O diagnóstico é por navegador: só quem está com o painel aberto recebe o bloco, e some junto com a conexão.
    escutar(EVENTOS_SOCKET.DIAGNOSTICO, (payload, ack) => {
      if (!permitido()) return responder(ack, { ok: false, erro: "Muitas requisições." });
      const codigo = String(payload?.codigo ?? "");
      const sala = salas.get(codigo);
      const assinatura = sala?.assinaturas.get(socket);
      if (!assinatura) return responder(ack, { ok: false, erro: "Exibição não conectada." });
      const ativo = Boolean(payload?.ativo);
      if (assinatura.diagnostico !== ativo) {
        assinatura.diagnostico = ativo;
        if (ativo && assinatura.pronta) emitirSnapshot(socket, codigo, sala, assinatura);
      }
      return responder(ack, { ok: true, ativo });
    });
    // Cenários de falha da SPTrans (só com o simulador habilitado e a partir de quem está com o painel aberto).
    escutar(EVENTOS_SOCKET.SIMULAR, (payload, ack) => {
      if (!permitido()) return responder(ack, { ok: false, erro: "Muitas requisições." });
      if (!simulador) return responder(ack, { ok: false, erro: "Simulação desabilitada neste servidor." });
      const codigo = String(payload?.codigo ?? "");
      const sala = salas.get(codigo);
      const assinatura = sala?.assinaturas.get(socket);
      if (!assinatura?.diagnostico) return responder(ack, { ok: false, erro: "Abra os detalhes técnicos para simular." });
      const cenario = String(payload?.cenario ?? "");
      if (cenario === "queda_socket") {
        // Fecha só o transporte: o cliente enxerga "transport close" e reconecta sozinho, como numa queda de rede.
        responder(ack, { ok: true, simulacao: simulador.estado() });
        setTimeout(() => socket.conn.close(), 50);
        return;
      }
      const duracaoMs = Number(payload?.duracaoSeg) * 1000;
      let estado;
      try {
        estado = simulador.definir(cenario, duracaoMs);
      } catch (erro) {
        return responder(ack, { ok: false, erro: erro.message });
      }
      console.warn(`[simulador] cenário "${estado.cenario}" definido pela sala ${codigo}`);
      // Consulta já, em vez de esperar o próximo ciclo, para o efeito aparecer no painel na hora.
      for (const parada of assinatura.paradas) poller.atualizarAgora(parada);
      return responder(ack, { ok: true, simulacao: estado });
    });
    escutar(EVENTOS_SOCKET.CONFIGURAR, (payload, ack) => {
      if (!permitido()) return responder(ack, { ok: false, erro: "Muitas requisições." });
      const codigo = String(payload?.codigo ?? "");
      const sala = salas.get(codigo);
      if (!sala?.assinaturas.has(socket)) return responder(ack, { ok: false, erro: "Exibição não conectada." });
      // Atualiza o mesmo objeto: os listeners do poller guardam a referência e passam a ver a nova configuração.
      Object.assign(sala.configuracao, sanearConfiguracao(payload?.config, sala.configuracao));
      reaplicarConfiguracao(codigo, sala);
      return responder(ack, { ok: true, configuracao: { permitirMultiplosPorLinha: Boolean(sala.configuracao.permitirMultiplosPorLinha) } });
    });
    escutar(EVENTOS_SOCKET.SAIR, (payload) => {
      sairDaSala(socket, String(payload?.codigo ?? ""));
    });
    escutar(EVENTOS_SOCKET.HEARTBEAT, (ack) => responder(ack, { ok: true }));
    socket.on("disconnect", () => {
      metricas.conectados = Math.max(0, metricas.conectados - 1);
      metricas.ultimaDesconexaoEm = new Date().toISOString();
      for (const codigo of [...assinaturas.keys()]) sairDaSala(socket, codigo);
    });

    function sairDaSala(cliente, codigo) {
      const sala = salas.get(codigo);
      const assinatura = sala?.assinaturas.get(cliente);
      if (!assinatura) return;
      assinatura.desligar?.();
      sala.assinaturas.delete(cliente);
      assinaturas.delete(codigo);
      cliente.leave(`exibicao:${codigo}`);
      metricas.saidas += 1;
      if (!sala.assinaturas.size) {
        clearTimeout(sala.publicacaoAgendada);
        salas.delete(codigo);
      }
    }
    // O primeiro snapshot sai assim que todas as paradas do cliente têm resultado: uma emissão no `entrar`, em vez
    // de uma por parada. Depois, as atualizações das paradas só marcam o cliente como pendente e a sala publica
    // um snapshot por ciclo (ver pedirPublicacao).
    function iniciarAssinatura(cliente, codigo, paradas, sala, diagnostico) {
      const assinatura = { paradas, snapshots: new Map(), pronta: false, pendente: false, diagnostico, desligar: null };
      sala.assinaturas.set(cliente, assinatura);
      assinaturas.set(codigo, assinatura);
      const enviar = (snapshot) => {
        if (sala.assinaturas.get(cliente) !== assinatura) return;
        assinatura.snapshots.set(snapshot.codigoParada, snapshot);
        if (!assinatura.pronta) {
          if (assinatura.snapshots.size < paradas.length) return;
          assinatura.pronta = true;
          emitirSnapshot(cliente, codigo, sala, assinatura);
          return;
        }
        assinatura.pendente = true;
        pedirPublicacao(codigo, sala);
      };
      const encerramentos = paradas.map((parada) => poller.iniciar(parada, enviar, sala.configuracao));
      assinatura.desligar = () => encerramentos.forEach((desligar) => desligar());
    }
    // Refaz os snapshots a partir do cache do poller (sem consultar a SPTrans) e emite uma vez por cliente.
    function reaplicarConfiguracao(codigo, sala) {
      sala.assinaturas.forEach((assinatura, cliente) => {
        for (const parada of assinatura.snapshots.keys()) {
          assinatura.snapshots.set(parada, poller.snapshot(parada, sala.configuracao));
        }
        if (assinatura.pronta) emitirSnapshot(cliente, codigo, sala, assinatura);
      });
    }
  });
  // Uma janela por sala: as paradas respondem quase juntas (consultas na mesma grade), então tudo o que chegar
  // até `janelaMs` depois da primeira atualização vai num único snapshot por cliente, em vez de um por parada.
  function pedirPublicacao(codigo, sala) {
    if (sala.publicacaoAgendada) return;
    sala.publicacaoAgendada = setTimeout(() => {
      sala.publicacaoAgendada = null;
      if (salas.get(codigo) !== sala) return;
      sala.assinaturas.forEach((assinatura, cliente) => {
        if (assinatura.pronta && assinatura.pendente) emitirSnapshot(cliente, codigo, sala, assinatura);
      });
    }, janelaMs);
  }
  // Contabiliza o envio no servidor (global) e na sala. Os bytes não incluem o bloco de diagnóstico.
  function emitirSnapshot(cliente, codigo, sala, assinatura) {
    assinatura.pendente = false;
    const lista = [...assinatura.snapshots.values()];
    const resposta = montarResposta(codigo, lista, sala.configuracao);
    const tamanho = Buffer.byteLength(JSON.stringify(resposta), "utf8");
    metricas.snapshotsEnviados += 1;
    metricas.snapshotBytesAtual = tamanho;
    metricas.snapshotBytesTotal += tamanho;
    sala.metricas.snapshotsEnviados += 1;
    sala.metricas.snapshotBytesAtual = tamanho;
    sala.metricas.snapshotBytesTotal += tamanho;
    if (assinatura.diagnostico && lista.some((item) => item.diagnostico)) {
      resposta.diagnostico = {
        paradas: lista.map((item) => ({ codigo: item.codigoParada, estadoConexao: item.estadoConexao, ...item.diagnostico })),
        socket: diagnosticoSocket(sala),
        simulacao: simulador ? simulador.estado() : { disponivel: false },
        recebidoEm: new Date().toISOString(),
      };
    }
    cliente.emit(EVENTOS_SOCKET.SNAPSHOT, resposta);
  }
  // Com a sala informada, os campos de snapshot são os da sala; os do servidor inteiro ficam em servidor*.
  function diagnosticoSocket(sala) {
    const daSala = sala?.metricas ?? metricas;
    return {
      clientesConectados: metricas.conectados,
      totalConexoes: metricas.totalConexoes,
      entradas: metricas.entradas,
      saidas: metricas.saidas,
      snapshotsEnviados: daSala.snapshotsEnviados,
      snapshotBytesAtual: daSala.snapshotBytesAtual,
      snapshotBytesTotal: daSala.snapshotBytesTotal,
      metricasDesde: daSala.desde ?? null,
      servidorSnapshotsEnviados: metricas.snapshotsEnviados,
      servidorSnapshotBytesTotal: metricas.snapshotBytesTotal,
      salasAtivas: salas.size,
      ultimaConexaoEm: metricas.ultimaConexaoEm,
      ultimaDesconexaoEm: metricas.ultimaDesconexaoEm,
    };
  }
  io.diagnostico = (codigo) => diagnosticoSocket(
    salas.get(codigo) ?? (metricasPorSala.has(codigo) ? { metricas: metricasPorSala.get(codigo) } : undefined),
  );
  return io;
}
