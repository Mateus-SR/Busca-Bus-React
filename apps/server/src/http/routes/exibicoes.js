import { Router } from "express";
import { randomInt } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import {
  CONFIG_EXIBICAO_TEMPORARIA,
  LIMITE_PARADAS_EXIBICAO,
  VALIDADE_EXIBICAO_TEMPORARIA_HORAS,
  codigoParadaValido,
  ehAdmin,
} from "@busca-bus/core";
import { Usuario } from "../../../models/Usuario.js";
import { criarExibicoesRepo } from "../../repos/exibicoes.js";
import { montarListaPontos } from "../../sptrans/normalizar.js";
import { exigirAutenticacao } from "../authMiddleware.js";

const LIMITES = {
  tempoAtraso: { min: 1, max: 5 },
  tempoAdiantado: { min: 1, max: 5 },
  distanciaMaxMin: { min: 5, max: 60 },
};
const LIMITE_NOME_EXIBICAO = 25;
// Intervalo mínimo entre duas criações do mesmo usuário (evita duplicar por duplo clique ou reenvio).
const INTERVALO_MINIMO_CRIACAO_MS = 5_000;
const ALFABETO_CODIGO_EXIBICAO = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

function gerarCodigoExibicao(tamanho = 6) {
  return Array.from({ length: tamanho }, () => ALFABETO_CODIGO_EXIBICAO[randomInt(ALFABETO_CODIGO_EXIBICAO.length)]).join("");
}

function validarParadas(paradas) {
  if (!Array.isArray(paradas) || paradas.length < 1 || paradas.length > LIMITE_PARADAS_EXIBICAO) {
    return [`Informe de 1 a ${LIMITE_PARADAS_EXIBICAO} pontos de ônibus.`];
  }
  if (paradas.some((codigo) => !codigoParadaValido(codigo))) {
    return ["Os códigos de parada devem ter de 1 a 9 dígitos."];
  }
  if (new Set(paradas.map((codigo) => String(codigo))).size !== paradas.length) {
    return ["Não é permitido repetir o mesmo código de parada."];
  }
  return [];
}

function validarEntrada(body) {
  const nome = String(body?.nome ?? "").trim();
  const paradas = body?.paradas;
  const config = body?.config || {};
  const erros = [];
  if (nome.length > LIMITE_NOME_EXIBICAO) {
    erros.push(`O nome da exibição deve ter no máximo ${LIMITE_NOME_EXIBICAO} caracteres.`);
  }
  erros.push(...validarParadas(paradas));
  for (const [campo, limite] of Object.entries(LIMITES)) {
    const valor = Number(config[campo]);
    if (!Number.isInteger(valor) || valor < limite.min || valor > limite.max) {
      erros.push(`${campo} deve estar entre ${limite.min} e ${limite.max}.`);
    }
  }
  if (body?.instituicaoId !== null && body?.instituicaoId !== undefined && typeof body.instituicaoId !== "string") {
    erros.push("Instituição inválida.");
  }
  return erros;
}

function normalizarEntrada(body) {
  return {
    nome: String(body.nome || "").trim(),
    instituicaoId: body.instituicaoId || null,
    paradas: body.paradas.map((codigo) => String(codigo)),
    config: {
      tempoAtraso: Number(body.config.tempoAtraso),
      tempoAdiantado: Number(body.config.tempoAdiantado),
      distanciaMaxMin: Number(body.config.distanciaMaxMin),
      permitirMultiplosPorLinha: Boolean(body.config.permitirMultiplosPorLinha),
    },
  };
}

export function exibicoesRoutes(db, config, poller, io = null) {
  const router = Router();
  const repo = criarExibicoesRepo(db);
  const protegido = exigirAutenticacao(config, db?.collection("sessoes"));
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
  async function podeVerDiagnostico(req, exibicao) {
    const [tipo, token] = String(req.headers.authorization || "").split(" ");
    if (tipo !== "Bearer" || !token || !config.jwtSecret || !db) return false;
    try {
      const carga = jwt.verify(token, config.jwtSecret);
      if (!mongoose.isValidObjectId(carga.sid) || !mongoose.isValidObjectId(carga.sub)) return false;
      const sessao = await db.collection("sessoes").findOne({
        _id: new mongoose.Types.ObjectId(carga.sid),
        usuarioId: new mongoose.Types.ObjectId(carga.sub),
        expiraEm: { $gt: new Date() },
      });
      if (!sessao) return false;
      const usuario = await Usuario.findById(carga.sub).select("role");
      return Boolean(usuario && (ehAdmin(usuario.role) || String(exibicao.usuarioId) === String(carga.sub)));
    } catch {
      return false;
    }
  }
  const aplicarOverrideLocal = (exibicao, req) => {
    if (req.query.permitirMultiplosPorLinha === "true") {
      return { ...exibicao, config: { ...exibicao.config, permitirMultiplosPorLinha: true } };
    }
    if (req.query.permitirMultiplosPorLinha === "false") {
      return { ...exibicao, config: { ...exibicao.config, permitirMultiplosPorLinha: false } };
    }
    return exibicao;
  };
  // Último instante de criação por usuário. Reservar antes de qualquer `await` fecha a brecha de dois envios
  // simultâneos passarem juntos; vale por instância do servidor (suficiente para barrar duplo clique/reenvio).
  const ultimaCriacaoPorUsuario = new Map();
  function reservarCriacao(usuarioId) {
    const agora = Date.now();
    for (const [id, instante] of ultimaCriacaoPorUsuario) {
      if (agora - instante >= INTERVALO_MINIMO_CRIACAO_MS) ultimaCriacaoPorUsuario.delete(id);
    }
    const anterior = ultimaCriacaoPorUsuario.get(String(usuarioId));
    if (anterior !== undefined) return Math.ceil((INTERVALO_MINIMO_CRIACAO_MS - (agora - anterior)) / 1000);
    ultimaCriacaoPorUsuario.set(String(usuarioId), agora);
    return 0;
  }
  async function gerarCodigoLivre() {
    let codigo;
    do {
      codigo = gerarCodigoExibicao();
    } while (await repo.porCodigo(codigo));
    return codigo;
  }
  // Sem login, então o limite por IP é o que segura abuso: poucas por janela de 10 min.
  const limitarTemporarias = rateLimit({
    windowMs: 10 * 60_000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { erro: "Muitas exibições temporárias criadas. Tente novamente em alguns minutos." },
  });
  router.post("/temporaria", limitarTemporarias, async (req, res, next) => {
    try {
      if (!repo.disponivel) return res.status(503).json({ erro: "Banco de dados não configurado." });
      const erros = validarParadas(req.body?.paradas);
      if (erros.length) return res.status(400).json({ erro: erros.join(" ") });
      const agora = new Date();
      const exibicao = {
        codigo: await gerarCodigoLivre(),
        nome: "Exibição temporária",
        instituicaoId: null,
        paradas: req.body.paradas.map((codigo) => String(codigo)),
        config: { ...CONFIG_EXIBICAO_TEMPORARIA },
        ativo: true,
        temporaria: true,
        criadoEm: agora.toISOString(),
        expiraEm: new Date(agora.getTime() + VALIDADE_EXIBICAO_TEMPORARIA_HORAS * 3_600_000).toISOString(),
      };
      await repo.criar(exibicao);
      return res.status(201).json({ exibicao });
    } catch (error) {
      return next(error);
    }
  });
  router.post("/", protegido, async (req, res, next) => {
    let reservou = false;
    try {
      if (!repo.disponivel) return res.status(503).json({ erro: "Banco de dados não configurado." });
      const erros = validarEntrada(req.body);
      if (erros.length) return res.status(400).json({ erro: erros.join(" ") });
      const espera = reservarCriacao(req.usuarioId);
      if (espera) {
        res.set("Retry-After", String(espera));
        return res.status(429).json({ erro: `Aguarde ${espera} s antes de criar outra exibição.` });
      }
      reservou = true;
      const exibicao = {
        codigo: await gerarCodigoLivre(),
        usuarioId: req.usuarioId,
        ativo: true,
        criadoEm: new Date().toISOString(),
        ...normalizarEntrada(req.body),
      };
      await repo.criar(exibicao);
      return res.status(201).json({ exibicao });
    } catch (error) {
      // Falha antes de gravar: libera para a pessoa tentar de novo sem esperar.
      if (reservou) ultimaCriacaoPorUsuario.delete(String(req.usuarioId));
      return next(error);
    }
  });
  router.get("/usuario", protegido, async (req, res, next) => {
    try {
      if (!repo.disponivel) return res.status(503).json({ erro: "Banco de dados não configurado." });
      return res.json({ exibicoes: await repo.doUsuario(req.usuarioId) });
    } catch (error) {
      return next(error);
    }
  });
  router.put("/:codigo", protegido, async (req, res, next) => {
    try {
      if (!repo.disponivel) return res.status(503).json({ erro: "Banco de dados não configurado." });
      const erros = validarEntrada(req.body);
      if (erros.length) return res.status(400).json({ erro: erros.join(" ") });
      const exibicao = await repo.atualizar(req.params.codigo, req.usuarioId, normalizarEntrada(req.body));
      if (!exibicao) return res.status(404).json({ erro: "Exibição não encontrada." });
      return res.json({ exibicao });
    } catch (error) {
      return next(error);
    }
  });
  router.delete("/:codigo", protegido, async (req, res, next) => {
    try {
      if (!repo.disponivel) return res.status(503).json({ erro: "Banco de dados não configurado." });
      const exibicao = await repo.excluir(req.params.codigo, req.usuarioId);
      if (!exibicao) return res.status(404).json({ erro: "Exibição não encontrada." });
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });
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
        const incluirDiagnostico = req.query.diagnostico === "1";
        if (incluirDiagnostico && !(await podeVerDiagnostico(req, exibicao))) {
          return res.status(403).json({ erro: "Você não tem permissão para ver os detalhes técnicos." });
        }
        const configuracao = aplicarOverrideLocal(exibicao, req);
        const snapshots = await Promise.all((configuracao.paradas || []).map((parada) => poller.consultar(parada, configuracao.config)));
        return responderSnapshot(res, compactarSnapshot(req.params.codigo, configuracao, snapshots, incluirDiagnostico, io?.diagnostico?.(req.params.codigo)));
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
    pontos: montarListaPontos(snapshots),
    ponto: snapshots.find((item) => item.ponto)?.ponto || null,
    onibus: snapshots.flatMap((item) => item.onibus.map((onibus) => ({
      ...onibus,
      codigoParada: item.codigoParada,
    }))),
    // Só vai junto quando o diagnóstico foi pedido; sem ele é peso morto em toda resposta.
    diagnosticoSocket: incluirDiagnostico ? diagnosticoSocket : undefined,
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
