
import { Router } from "express";
import mongoose from "mongoose";
import { exigirAutenticacao } from "../authMiddleware.js";

export function avaliacoesRoutes(db, config) {
  const router = Router();
  const avaliacoes = db?.collection("avaliacoes");
  const protegido = exigirAutenticacao(config, db?.collection("sessoes"));

  router.get("/minha", protegido, async (req, res, next) => {
    if (!avaliacoes) {
      return res.status(503).json({ erro: "Banco de dados indisponível." });
    }

    try {
      const existente = await avaliacoes.findOne({
        usuarioId: new mongoose.Types.ObjectId(req.usuarioId),
      });

      return res.json({
        jaAvaliou: Boolean(existente),
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", protegido, async (req, res, next) => {
    if (!avaliacoes) {
      return res.status(503).json({ erro: "Banco de dados indisponível." });
    }

    try {
      const {
        satisfacaoGeral,
        navegacao,
        ajudaViagem,
        avaliacaoProjeto,
        sugestoes,
      } = req.body || {};

      const notas = [satisfacaoGeral, navegacao, avaliacaoProjeto];

      if (!notas.every((nota) => Number.isInteger(nota) && nota >= 1 && nota <= 5)) {
        return res.status(400).json({
          erro: "Todas as notas devem estar entre 1 e 5.",
        });
      }

      if (
        typeof ajudaViagem !== "string" ||
        typeof sugestoes !== "string" ||
        ajudaViagem.length > 1000 ||
        sugestoes.length > 1000
      ) {
        return res.status(400).json({
          erro: "Os textos devem ter no máximo 1000 caracteres.",
        });
      }

      const novaAvaliacao = {
        usuarioId: new mongoose.Types.ObjectId(req.usuarioId),
        satisfacaoGeral,
        navegacao,
        ajudaViagem: ajudaViagem.trim(),
        avaliacaoProjeto,
        sugestoes: sugestoes.trim(),
        createdAt: new Date(),
      };

      const resultado = await avaliacoes.insertOne(novaAvaliacao);

      return res.status(201).json({
        mensagem: "Avaliação enviada com sucesso.",
        id: resultado.insertedId,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          erro: "Você já enviou sua avaliação.",
        });
      }

      return next(error);
    }
  });

  return router;
}
