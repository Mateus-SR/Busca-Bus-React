import { Router } from "express";
import { criarExibicoesRepo } from "../../repos/exibicoes.js";

export function exibicoesRoutes(db, config, poller, io = null) {
  const router = Router();
  const repo = criarExibicoesRepo(db);
  const codigosLocais = new Set([config.testDisplayCode, "dev", "testes"]);
  const teste = {
    codigo: config.testDisplayCode,
    nome: "Exibição SPTrans local",
    paradas: config.testStopCodes,
    config: { tempoAtraso: 2, tempoAdiantado: 2, distanciaMaxMin: 20, permitirMultiplosPorLinha: false },
    ativo: true,
    criadoEm: new Date().toISOString(),
  };
  const eTesteLocal = (codigo) => !config.mongodbUri && codigosLocais.has(codigo);
  const aplicarOverrideLocal = (exibicao, req) => {
    if (req.query.permitirMultiplosPorLinha === "true") {
      return { ...exibicao, config: { ...exibicao.config, permitirMultiplosPorLinha: true } };
    }
    if (req.query.permitirMultiplosPorLinha === "false") {
      return { ...exibicao, config: { ...exibicao.config, permitirMultiplosPorLinha: false } };
    }
    return exibicao;
  };
  router.get("/:codigo", async (req, res) => {
    if (eTesteLocal(req.params.codigo)) {
      return res.json({ exibicao: { ...teste, codigo: req.params.codigo } });
    }
    if (!repo.disponivel) return res.status(503).json({ erro: "Banco de dados não configurado." });
    const exibicao = await repo.porCodigo(req.params.codigo);
    if (!exibicao) return res.status(404).json({ erro: "Exibição não encontrada." });
    return res.json({ exibicao });
  });
  router.get("/:codigo/radar", async (req, res, next) => {
    try {
      if (!eTesteLocal(req.params.codigo)) {
        if (!repo.disponivel) return res.status(503).json({ erro: "Banco de dados não configurado." });
        const exibicao = await repo.porCodigo(req.params.codigo);
        if (!exibicao) return res.status(404).json({ erro: "Exibição não encontrada." });
        const configuracao = aplicarOverrideLocal(exibicao, req);
        const snapshots = await Promise.all((configuracao.paradas || []).map((parada) => poller.consultar(parada, configuracao.config)));
        return responderSnapshot(res, compactarSnapshot(req.params.codigo, configuracao, snapshots, req.query.diagnostico === "1", io?.diagnostico?.(req.params.codigo)));
      }
      const exibicaoLocal = { ...teste, codigo: req.params.codigo };
      const configuracao = aplicarOverrideLocal(exibicaoLocal, req);
      const snapshots = await Promise.all(configuracao.paradas.map((parada) => poller.consultar(parada, configuracao.config)));
      return responderSnapshot(res, compactarSnapshot(configuracao.codigo, configuracao, snapshots, req.query.diagnostico === "1", io?.diagnostico?.(configuracao.codigo)));
    } catch (error) {
      return next(error);
    }

    function responderSnapshot(res, snapshot) {
      if (snapshot.erro && !snapshot.atualizadoEm && snapshot.onibus.length === 0) {
        return res.status(503).json(snapshot);
      }
      return res.json(snapshot);
    }
  });
  return router;
}

function compactarSnapshot(codigo, exibicao, snapshots, incluirDiagnostico, diagnosticoSocket) {
  const configuracao = {
    tempoAtraso: exibicao.config?.tempoAtraso ?? exibicao.config?.tempo_atraso ?? 2,
    tempoAdiantado: exibicao.config?.tempoAdiantado ?? exibicao.config?.tempo_adiantado ?? 2,
    distanciaMaxMin: exibicao.config?.distanciaMaxMin ?? exibicao.config?.distanciaMinOnibus ?? 20,
    permitirMultiplosPorLinha: Boolean(exibicao.config?.permitirMultiplosPorLinha ?? exibicao.config?.permitir_multiplos_por_linha),
  };
  const resposta = {
    codigo,
    configuracao,
    atualizadoEm: snapshots.map((item) => item.atualizadoEm).filter(Boolean).sort().at(-1) || null,
    exibicaoDesde: exibicao.criadoEm || null,
    estadoConexao: snapshots.some((item) => item.estadoConexao === "conectado") ? "conectado" : "reconectando",
    erro: snapshots.find((item) => item.erro)?.erro || null,
    paradas: snapshots.map((item) => item.codigoParada),
    pontos: snapshots.map((item) => item.ponto).filter(Boolean),
    ponto: snapshots.find((item) => item.ponto)?.ponto || null,
    onibus: snapshots.flatMap((item) => item.onibus.map((onibus) => ({
      ...onibus,
      codigoParada: item.codigoParada,
    }))),
    diagnosticoSocket,
  };
  if (incluirDiagnostico) {
    resposta.diagnostico = {
      paradas: snapshots.map((item) => ({
        codigo: item.codigoParada,
        estadoConexao: item.estadoConexao,
        ...item.diagnostico,
      })),
      socket: diagnosticoSocket,
      recebidoEm: new Date().toISOString(),
    };
  }
  return resposta;
}
