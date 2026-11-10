import { Router } from "express";
import mongoose from "mongoose";
import { Usuario } from "../../../models/Usuario.js";
import { exigirAutenticacao } from "../authMiddleware.js";
import { criarFavoritosRepo } from "../../repos/favoritos.js";

const AVATARES_PERMITIDOS = new Set([
  "avatar-01",
  "avatar-02",
  "avatar-03",
  "avatar-04",
  "avatar-05",
  "avatar-06",
  "avatar-07",
  "avatar-08",
  "avatar-09",
  "avatar-10",
  "avatar-11",
  "avatar-12",
  "avatar-13",
  "avatar-14",
  "avatar-15",
  "avatar-16",
]);
export function meRoutes(config, db) {
  const router = Router();
  const sessoes = db?.collection("sessoes");
  const favoritosRepo = criarFavoritosRepo(db);
  const protegido = exigirAutenticacao(config, sessoes);
  const indisponivel = (_req, res) => res.status(501).json({ erro: "Autenticação necessária para este recurso." });
  router.get("/", protegido, async (req, res, next) => {
    try {
      const usuario = await Usuario.findById(req.usuarioId).select("nome email role fac_id avatarId");
      if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
      return res.json({
        usuario: {
          id: usuario._id.toString(),
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          fac_id: usuario.fac_id?.toString() || null,
          avatarId: usuario.avatarId || null,
        },
      });
    } catch (error) {
      return next(error);
    }
  });
  router.patch("/avatar", protegido, async (req, res, next) => {
    try {
      const avatarId = String(req.body?.avatarId || "");
      if (!AVATARES_PERMITIDOS.has(avatarId)) {
        return res.status(400).json({ erro: "Avatar inválido." });
      }
      if (!mongoose.isValidObjectId(req.usuarioId)) {
        return res.status(401).json({ erro: "Sessão inválida." });
      }
      const usuario = await Usuario.findByIdAndUpdate(
        req.usuarioId,
        { avatarId },
        { new: true, runValidators: true, select: "nome email role fac_id avatarId" },
      );
      if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
      return res.json({
        usuario: {
          id: usuario._id.toString(),
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          fac_id: usuario.fac_id?.toString() || null,
          avatarId: usuario.avatarId || null,
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.patch("/instituicao", protegido, async (req, res, next) => {
    try {
      const facId = req.body?.fac_id;

      if (
        facId !== null &&
        (typeof facId !== "string" || !mongoose.isValidObjectId(facId))
      ) {
        return res.status(400).json({ erro: "Instituição inválida." });
      }

      if (facId) {
        const fatec = await db.collection("Fatec").findOne({
          _id: new mongoose.Types.ObjectId(facId),
        });

        if (!fatec) {
          return res.status(404).json({ erro: "Instituição não encontrada." });
        }
      }

      const usuario = await Usuario.findByIdAndUpdate(
        req.usuarioId,
        { fac_id: facId ? new mongoose.Types.ObjectId(facId) : null },
        {
          new: true,
          runValidators: true,
          select: "nome email role fac_id avatarId",
        },
      );

      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado." });
      }

      return res.json({
        usuario: {
          id: usuario._id.toString(),
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          fac_id: usuario.fac_id?.toString() || null,
          avatarId: usuario.avatarId || null,
        },
      });
    } catch (error) {
      return next(error);
    }
  });
  router.get("/token-sptrans", protegido, async (req, res, next) => {
    try {
      const usuario = await Usuario.findById(req.usuarioId).select("token");
      if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
      return res.json({ token: usuario.token || "" });
    } catch (error) {
      return next(error);
    }
  });
  router.put("/token-sptrans", protegido, async (req, res, next) => {
    try {
      const token = String(req.body?.token || "").trim();
      if (!token) return res.status(400).json({ erro: "Token da API é obrigatório." });
      const usuario = await Usuario.findByIdAndUpdate(
        req.usuarioId,
        { token },
        { new: true, runValidators: true, select: "token" },
      );
      if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
      return res.json({ token: usuario.token });
    } catch (error) {
      return next(error);
    }
  });
  router.get("/favoritos", protegido, async (req, res, next) => {
    try {
      if (!favoritosRepo.disponivel) return res.status(503).json({ erro: "Banco de dados não configurado." });
      return res.json({ favoritos: await favoritosRepo.listar(req.usuarioId) });
    } catch (error) {
      return next(error);
    }
  });
  router.post("/favoritos/:codigo", protegido, async (req, res, next) => {
    try {
      if (!favoritosRepo.disponivel) return res.status(503).json({ erro: "Banco de dados não configurado." });
      const resultado = await favoritosRepo.adicionar(req.usuarioId, req.params.codigo);
      if (!resultado) return res.status(404).json({ erro: "Exibição não encontrada." });
      return res.status(resultado.jaExistia ? 200 : 201).json({
        favoritado: true,
        exibicao: resultado.exibicao,
      });
    } catch (error) {
      return next(error);
    }
  });
  router.delete("/favoritos/:codigo", protegido, async (req, res, next) => {
    try {
      if (!favoritosRepo.disponivel) return res.status(503).json({ erro: "Banco de dados não configurado." });
      const removido = await favoritosRepo.remover(req.usuarioId, req.params.codigo);
      return res.json({ favoritado: false, removido });
    } catch (error) {
      return next(error);
    }
  });
  router.get("/favoritos/:codigo", protegido, async (req, res, next) => {
    try {
      if (!favoritosRepo.disponivel) return res.status(503).json({ erro: "Banco de dados não configurado." });
      return res.json({ favoritado: await favoritosRepo.verificar(req.usuarioId, req.params.codigo) });
    } catch (error) {
      return next(error);
    }
  });
  router.delete("/", indisponivel);
  router.get("/exibicoes", indisponivel);
  return router;
}
