import { Router } from "express";
import mongoose from "mongoose";
import { Usuario } from "../../../models/Usuario.js";
import { exigirAutenticacao } from "../authMiddleware.js";

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
  router.put("/token-sptrans", indisponivel);
  router.delete("/", indisponivel);
  router.get("/exibicoes", indisponivel);
  router.get("/favoritos", indisponivel);
  router.post("/favoritos/:codigo", indisponivel);
  router.delete("/favoritos/:codigo", indisponivel);
  return router;
}
