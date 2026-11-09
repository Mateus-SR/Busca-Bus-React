import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ehAdmin } from "@busca-bus/core";
import { Usuario } from "../../models/Usuario.js";

export function exigirAutenticacao(config, sessoes) {
  return async (req, res, next) => {
    const cabecalho = req.headers.authorization || "";
    const [tipo, token] = cabecalho.split(" ");

    if (tipo !== "Bearer" || !token || !config.jwtSecret) {
      return res.status(401).json({ erro: "Autenticação necessária." });
    }

    try {
      const carga = jwt.verify(token, config.jwtSecret);

      if (
        !sessoes ||
        !mongoose.isValidObjectId(carga.sid) ||
        !mongoose.isValidObjectId(carga.sub)
      ) {
        return res.status(401).json({ erro: "Sessão inválida ou expirada." });
      }

      const sessao = await sessoes.findOne({
        _id: new mongoose.Types.ObjectId(carga.sid),
        usuarioId: new mongoose.Types.ObjectId(carga.sub),
        expiraEm: { $gt: new Date() },
      });

      if (!sessao) {
        return res.status(401).json({ erro: "Sessão inválida ou expirada." });
      }

      req.usuarioId = carga.sub;
      return next();
    } catch (error) {
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return res.status(401).json({ erro: "Sessão inválida ou expirada." });
      }

      return next(error);
    }
  };
}
export function exigirAdmin(config, sessoes) {
  const autenticado = exigirAutenticacao(config, sessoes);

  const verificarPapel = async (req, res, next) => {
    try {
      const usuario = await Usuario.findById(req.usuarioId).select("role fac_id");
      if (!usuario || !ehAdmin(usuario.role)) {
        return res.status(403).json({ erro: "Apenas administradores podem fazer isso." });
      }
      req.usuario = usuario;
      return next();
    } catch (error) {
      return next(error);
    }
  };

  return [autenticado, verificarPapel];
}