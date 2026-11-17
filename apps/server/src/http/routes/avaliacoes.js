import { Router } from "express";
import mongoose from "mongoose";
import Avaliacao from "../../models/Avaliacao.js";
import { exigirAutenticacao } from "../authMiddleware.js";

export function avaliacoesRoutes(db, config) {
  const router = Router();
  const sessoes =
    db?.sessoes ||
    db?.collections?.sessoes ||
    mongoose.connection.collection("sessoes");
  const autenticado = exigirAutenticacao(config, sessoes);

  // 1. Listar todas as avaliações + médias gerais (Pública: GET /v1/avaliacoes)
  router.get("/", async (_req, res, next) => {
    try {
      const avaliacoes = await Avaliacao.aggregate([
        { $sort: { updatedAt: -1, createdAt: -1 } },
        {
          $lookup: {
            from: "Users",
            localField: "usuarioId",
            foreignField: "_id",
            as: "usuario",
          },
        },
        {
          $unwind: {
            path: "$usuario",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            usuarioId: 1,
            satisfacaoGeral: 1,
            navegacao: 1,
            avaliacaoProjeto: 1,
            ajudaViagem: 1,
            sugestoes: 1,
            createdAt: 1,
            updatedAt: 1,
            nomeUsuario: {
              $ifNull: ["$usuario.nome", { $ifNull: ["$usuario.name", "Estudante BuscaBus"] }],
            },
          },
        },
      ]);

      const total = avaliacoes.length;
      const calcularMedia = (campo) =>
        total > 0
          ? Number((avaliacoes.reduce((acc, item) => acc + (item[campo] || 0), 0) / total).toFixed(1))
          : 0;

      return res.status(200).json({
        avaliacoes,
        resumo: {
          total,
          mediaSatisfacaoGeral: calcularMedia("satisfacaoGeral"),
          mediaNavegacao: calcularMedia("navegacao"),
          mediaAvaliacaoProjeto: calcularMedia("avaliacaoProjeto"),
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  // 2. Buscar avaliação do usuário logado (Protegida: GET /v1/avaliacoes/minha)
  router.get("/minha", autenticado, async (req, res, next) => {
    try {
      const usuarioId = new mongoose.Types.ObjectId(req.usuarioId);
      const minhaAvaliacao = await Avaliacao.findOne({ usuarioId }).lean();

      return res.status(200).json({
        jaAvaliou: Boolean(minhaAvaliacao),
        avaliacao: minhaAvaliacao || null,
      });
    } catch (error) {
      return next(error);
    }
  });

  // 3. Criar ou Editar avaliação do usuário logado (Protegida: POST /v1/avaliacoes)
  router.post("/", autenticado, async (req, res, next) => {
    try {
      const usuarioId = new mongoose.Types.ObjectId(req.usuarioId);

      const {
        satisfacaoGeral,
        navegacao,
        avaliacaoProjeto,
        ajudaViagem,
        sugestoes,
      } = req.body;

      const notas = [satisfacaoGeral, navegacao, avaliacaoProjeto].map(Number);
      if (notas.some((n) => isNaN(n) || n < 1 || n > 5)) {
        return res.status(400).json({
          erro: "Preencha todas as notas (de 1 a 5) antes de enviar.",
        });
      }

      const avaliacaoSalva = await Avaliacao.findOneAndUpdate(
        { usuarioId },
        {
          $set: {
            usuarioId,
            satisfacaoGeral: Number(satisfacaoGeral),
            navegacao: Number(navegacao),
            avaliacaoProjeto: Number(avaliacaoProjeto),
            ajudaViagem: ajudaViagem ? String(ajudaViagem).trim() : "",
            sugestoes: sugestoes ? String(sugestoes).trim() : "",
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      return res.status(200).json({
        mensagem: "Avaliação salva com sucesso!",
        avaliacao: avaliacaoSalva,
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}