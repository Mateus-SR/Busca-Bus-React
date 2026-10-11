import { Server } from "socket.io";
import { EVENTOS_SOCKET } from "@busca-bus/core";

export function createSocketServer(httpServer, config, poller) {
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
  io.on("connection", (socket) => {
    metricas.conectados += 1;
    metricas.totalConexoes += 1;
    metricas.ultimaConexaoEm = new Date().toISOString();
    const assinaturas = new Map();
    socket.on(EVENTOS_SOCKET.ENTRAR, (payload, ack) => {
      const codigo = payload?.codigo;
      if (!/^[A-Za-z0-9_-]{1,32}$/.test(String(codigo || ""))) return ack?.({ ok: false, erro: "Código inválido." });
      const paradas = [...new Set((payload?.paradas?.length ? payload.paradas : [payload?.parada || config.testStopCode])
        .map((item) => String(item))
        .filter((item) => /^\d{7,9}$/.test(item)))];
      const configuracaoSolicitada = {
        tempoAtraso: 2,
        tempoAdiantado: 2,
        distanciaMaxMin: 20,
        permitirMultiplosPorLinha: false,
        ...(payload?.config || {}),
      };
      if (!paradas.length) return ack?.({ ok: false, erro: "Código de parada inválido." });
      sairDaSala(socket, codigo);
      metricas.entradas += 1;
      socket.join(`exibicao:${codigo}`);
      let sala = salas.get(codigo);
      if (!sala) {
        sala = { configuracao: configuracaoSolicitada, assinaturas: new Map(),
          diagnosticoSocket: false,
          metricas: { snapshotsEnviados: 0, snapshotBytesAtual: 0, snapshotBytesTotal: 0 },
        };
        salas.set(codigo, sala);
      }
      iniciarAssinatura(socket, codigo, paradas, sala);
      return ack?.({ ok: true, diagnosticoSocket: sala.diagnosticoSocket });
    });
    // O toggle é da sala: ao mudar, todos os navegadores da exibição recebem o novo estado.
    socket.on(EVENTOS_SOCKET.DIAGNOSTICO, (payload, ack) => {
      const codigo = payload?.codigo;
      const sala = salas.get(codigo);
      if (!sala?.assinaturas.has(socket)) return ack?.({ ok: false, erro: "Exibição não conectada." });
      sala.diagnosticoSocket = Boolean(payload?.ativo);
      io.to(`exibicao:${codigo}`).emit(EVENTOS_SOCKET.DIAGNOSTICO, { codigo, ativo: sala.diagnosticoSocket });
      sala.assinaturas.forEach((assinatura, cliente) => {
        if (assinatura.snapshots.size) emitirSnapshot(cliente, codigo, sala, [...assinatura.snapshots.values()]);
      });
      ack?.({ ok: true, ativo: sala.diagnosticoSocket });
    });
    socket.on(EVENTOS_SOCKET.CONFIGURAR, (payload, ack) => {
      const codigo = payload?.codigo;
      const sala = salas.get(codigo);
      if (!sala?.assinaturas.has(socket)) return ack?.({ ok: false, erro: "Exibição não conectada." });
      sala.configuracao = {
        ...sala.configuracao,
        ...(payload?.config || {}),
      };
      sala.assinaturas.forEach((assinatura, cliente) => iniciarAssinatura(cliente, codigo, assinatura.paradas, sala));
      ack?.({ ok: true, configuracao: { permitirMultiplosPorLinha: Boolean(sala.configuracao.permitirMultiplosPorLinha) } });
    });
    socket.on(EVENTOS_SOCKET.SAIR, (payload) => {
      const codigo = payload?.codigo;
      sairDaSala(socket, codigo);
    });
    socket.on("disconnect", () => {
      metricas.conectados = Math.max(0, metricas.conectados - 1);
      metricas.ultimaDesconexaoEm = new Date().toISOString();
      for (const codigo of assinaturas.keys()) sairDaSala(socket, codigo);
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
      if (!sala.assinaturas.size) salas.delete(codigo);
    }
    function iniciarAssinatura(cliente, codigo, paradas, sala) {
      const anterior = sala.assinaturas.get(cliente);
      anterior?.desligar?.();
      const assinatura = {
        paradas,
        revisao: (anterior?.revisao || 0) + 1,
        snapshots: new Map(),
        desligar: null,
      };
      sala.assinaturas.set(cliente, assinatura);
      assinaturas.set(codigo, assinatura);
      const revisao = assinatura.revisao;
      const enviar = (snapshot) => {
        if (sala.assinaturas.get(cliente) !== assinatura || assinatura.revisao !== revisao) return;
        assinatura.snapshots.set(snapshot.codigoParada, snapshot);
        emitirSnapshot(cliente, codigo, sala, [...assinatura.snapshots.values()]);
      };
      const encerramentos = paradas.map((parada) => poller.iniciar(parada, enviar, sala.configuracao));
      assinatura.desligar = () => encerramentos.forEach((desligar) => desligar());
      Promise.all(paradas.map((parada) => poller.consultar(parada, sala.configuracao))).then((lista) => lista.forEach(enviar));
    }
    // Contabiliza o envio no servidor (global) e na sala, para o total ser o mesmo em todos os navegadores.
    function emitirSnapshot(cliente, codigo, sala, lista) {
      const resposta = compactarSocket(codigo, lista, sala.configuracao, sala.diagnosticoSocket, sala);
      const tamanho = Buffer.byteLength(JSON.stringify(resposta), "utf8");
      metricas.snapshotsEnviados += 1;
      metricas.snapshotBytesAtual = tamanho;
      metricas.snapshotBytesTotal += tamanho;
      sala.metricas.snapshotsEnviados += 1;
      sala.metricas.snapshotBytesAtual = tamanho;
      sala.metricas.snapshotBytesTotal += tamanho;
      cliente.emit(EVENTOS_SOCKET.SNAPSHOT, resposta);
    }
    function compactarSocket(codigo, lista, configuracao, incluirDiagnostico, sala) {
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
        diagnostico: incluirDiagnostico && lista.some((item) => item.diagnostico) ? {
          paradas: lista.map((item) => ({ codigo: item.codigoParada, estadoConexao: item.estadoConexao, ...item.diagnostico })),
          socket: diagnosticoSocket(sala),
          recebidoEm: new Date().toISOString(),
        } : undefined,
      };
    }
    socket.on(EVENTOS_SOCKET.HEARTBEAT, (ack) => ack?.({ ok: true }));
  });
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
      servidorSnapshotsEnviados: metricas.snapshotsEnviados,
      servidorSnapshotBytesTotal: metricas.snapshotBytesTotal,
      salasAtivas: [...io.sockets.adapter.rooms.keys()].filter((nome) => nome.startsWith("exibicao:")).length,
      ultimaConexaoEm: metricas.ultimaConexaoEm,
      ultimaDesconexaoEm: metricas.ultimaDesconexaoEm,
    };
  }
  io.diagnostico = (codigo) => diagnosticoSocket(salas.get(codigo));
  return io;
}
