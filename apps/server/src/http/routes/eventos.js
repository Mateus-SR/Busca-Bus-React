import { Router } from "express";
import mongoose from "mongoose";
import { TIPOS_EVENTO } from "@busca-bus/core";
import { exigirAdmin } from "../authMiddleware.js";

const HORA_MIN = 7;
const HORA_MAX = 23;
const FUSO = "America/Sao_Paulo";

const formatador = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partesNoFuso(data) {
  const p = Object.fromEntries(formatador.formatToParts(data).map(({ type, value }) => [type, value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, minutos: Number(p.hour) * 60 + Number(p.minute) };
}

const lerTexto = (valor, maximo) => {
  const texto = String(valor ?? "").trim();
  return texto && texto.length <= maximo ? texto : null;
};

const lerData = (valor) => {
  if (typeof valor !== "string") return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
};

const ehIdValido = (valor) => /^[a-fA-F0-9]{24}$/.test(String(valor ?? ""));

const paraResposta = (evento) => ({
  id_evento: evento._id.toString(),
  tipo: evento.tipo,
  titulo: evento.titulo,
  cor: evento.cor,
  inicio: evento.inicio.toISOString(),
  fim: evento.fim.toISOString(),
  local: evento.local,
  descricao: evento.descricao,
  fac_id: evento.fac_id?.toString() || null,
});

export function eventosRoutes(db, config) {
  const router = Router();
  const eventos = db?.collection("Eventos");
  const fatecs = db?.collection("Fatec");
  const admin = exigirAdmin(config, db?.collection("sessoes"));
  const indisponivel = (res) => res.status(503).json({ erro: "Banco de dados indisponível." });
  const validarEvento = async (body, facIdPadrao) => {
    const { tipo, titulo, inicio, fim, local, descricao, fac_id } = body || {};
    const tipoEscolhido = TIPOS_EVENTO.find((item) => item.valor === tipo);
    if (!tipoEscolhido) return { erro: "Escolha um tipo de evento válido." };

    const tituloLimpo = lerTexto(titulo, 80);
    if (!tituloLimpo) return { erro: "Informe o título do evento (até 80 caracteres)." };

    const localLimpo = lerTexto(local, 80);
    if (!localLimpo) return { erro: "Informe o local do evento (até 80 caracteres)." };

    const descricaoLimpa = lerTexto(descricao, 500);
    if (!descricaoLimpa) return { erro: "Informe a descrição do evento (até 500 caracteres)." };

    const dataInicio = lerData(inicio);
    const dataFim = lerData(fim);
    if (!dataInicio || !dataFim) return { erro: "Data ou horário inválido." };

    const comecou = partesNoFuso(dataInicio);
    const terminou = partesNoFuso(dataFim);
    if (comecou.dia !== terminou.dia) {
      return { erro: "O evento deve começar e terminar no mesmo dia." };
    }
    if (terminou.minutos <= comecou.minutos) {
      return { erro: "O horário de término deve ser depois do início." };
    }
    if (comecou.minutos < HORA_MIN * 60 || terminou.minutos > HORA_MAX * 60) {
      return { erro: "Os eventos devem acontecer entre 07:00 e 23:00." };
    }

    const facEscolhida = fac_id || facIdPadrao;
    if (!ehIdValido(facEscolhida)) return { erro: "Escolha a Fatec do evento." };
    const facId = new mongoose.Types.ObjectId(facEscolhida);
    if (!(await fatecs.findOne({ _id: facId }))) return { erro: "Fatec não encontrada." };

    return {
      evento: {
        tipo: tipoEscolhido.valor,
        titulo: tituloLimpo,
        cor: tipoEscolhido.cor,
        inicio: dataInicio,
        fim: dataFim,
        local: localLimpo,
        descricao: descricaoLimpa,
        fac_id: facId,
      },
    };
  };

  router.get("/", async (_req, res, next) => {
    if (!eventos) return indisponivel(res);
    try {
      const lista = await eventos.find({}).sort({ inicio: 1 }).limit(500).toArray();
      return res.json({ eventos: lista.map(paraResposta) });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/semana", async (req, res, next) => {
    if (!eventos) return indisponivel(res);

    const facId = String(req.query.fac_id ?? "");
    const inicio = lerData(req.query.inicio);
    const fim = lerData(req.query.fim);

    if (!ehIdValido(facId)) {
      return res.status(400).json({ erro: "Instituição inválida." });
    }

    if (!inicio || !fim || fim <= inicio) {
      return res.status(400).json({ erro: "Período inválido." });
    }

    try {
      const lista = await eventos
        .find({
          fac_id: new mongoose.Types.ObjectId(facId),
          inicio: { $gte: inicio, $lt: fim },
        })
        .sort({ inicio: 1 })
        .limit(100)
        .toArray();

      return res.json({ eventos: lista.map(paraResposta) });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", admin, async (req, res, next) => {
    if (!eventos || !fatecs) return indisponivel(res);
    try {
      const resultado = await validarEvento(req.body, req.usuario.fac_id?.toString());
      if (resultado.erro) return res.status(400).json({ erro: resultado.erro });

      const novo = {
        ...resultado.evento,
        criado_por: req.usuario._id,
        created_at: new Date(),
      };
      const { insertedId } = await eventos.insertOne(novo);

      return res.status(201).json({ evento: paraResposta({ ...novo, _id: insertedId }) });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", admin, async (req, res, next) => {
    if (!eventos || !fatecs) return indisponivel(res);
    if (!ehIdValido(req.params.id)) return res.status(400).json({ erro: "Evento inválido." });

    try {
      const _id = new mongoose.Types.ObjectId(req.params.id);
      const existente = await eventos.findOne({ _id });
      if (!existente) return res.status(404).json({ erro: "Evento não encontrado." });

      const resultado = await validarEvento(req.body, req.usuario.fac_id?.toString());
      if (resultado.erro) return res.status(400).json({ erro: resultado.erro });

      await eventos.updateOne({ _id }, { $set: resultado.evento });
      return res.json({ evento: paraResposta({ ...existente, ...resultado.evento, _id }) });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", admin, async (req, res, next) => {
    if (!eventos) return indisponivel(res);
    if (!ehIdValido(req.params.id)) return res.status(400).json({ erro: "Evento inválido." });

    try {
      const { deletedCount } = await eventos.deleteOne({
        _id: new mongoose.Types.ObjectId(req.params.id),
      });
      if (!deletedCount) return res.status(404).json({ erro: "Evento não encontrado." });
      return res.json({ removido: true });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}