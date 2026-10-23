import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { Usuario } from "../../../models/Usuario.js";
import { validarEmail, validarSenha } from "@busca-bus/core";

const publicUser = (user) => ({
  id: user._id?.toString(),
  nome: user.nome,
  email: user.email,
  role: user.role,
});

const unavailable = (res) =>
  res.status(503).json({
    erro: "Autenticação indisponível: configure MONGODB_URI e JWT_SECRET.",
  });

export function authRoutes({ config, db }) {
  const router = Router();
  const sessoes = db?.collection("sessoes");

  router.post("/cadastro", async (req, res, next) => {
    if (Usuario.db.readyState !== 1 || !config.jwtSecret) {
      return unavailable(res);
    }

    try {
      const { nome, email, senha } = req.body || {};
      const normalized = String(email || "").trim().toLowerCase();

      if (
        !String(nome || "").trim() ||
        !validarEmail(normalized) ||
        !validarSenha(senha)
      ) {
        return res.status(400).json({
          erro: "Dados de cadastro inválidos.",
        });
      }

      const existente = await Usuario.findOne({ email: normalized });

      if (existente) {
        return res.status(409).json({
          erro: "Não foi possível criar a conta.",
        });
      }

      const user = await Usuario.create({
        nome: String(nome).trim(),
        email: normalized,
        senhaHash: await bcrypt.hash(senha, 12),
        role: "usuario",
        created_at: new Date(),
      });

      return res.status(201).json({
        usuario: publicUser(user),
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          erro: "Não foi possível criar a conta.",
        });
      }

      return next(error);
    }
  });

  router.post("/login", async (req, res, next) => {
    if (
      Usuario.db.readyState !== 1 ||
      !sessoes ||
      !config.jwtSecret
    ) {
      return unavailable(res);
    }

    try {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const user = await Usuario.findOne({ email });

      if (
        !user ||
        !(await bcrypt.compare(
          String(req.body?.senha || ""),
          user.senhaHash
        ))
      ) {
        return res.status(401).json({
          erro: "E-mail ou senha inválidos.",
        });
      }

      const accessToken = jwt.sign(
        { sub: user._id.toString(), role: user.role },
        config.jwtSecret,
        { expiresIn: "15m" }
      );

      const refreshToken = crypto.randomBytes(32).toString("base64url");

      await sessoes.insertOne({
        usuarioId: user._id,
        refreshHash: crypto
          .createHash("sha256")
          .update(refreshToken)
          .digest("hex"),
        familia: crypto.randomUUID(),
        expiraEm: new Date(Date.now() + 30 * 86400000),
        criadoEm: new Date(),
      });

      return res.json({
        accessToken,
        refreshToken,
        usuario: publicUser(user),
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/refresh", (_req, res) =>
    res.status(501).json({
      erro: "Rotação de sessão será habilitada na próxima etapa.",
    })
  );

  router.post("/logout", (_req, res) => res.status(204).end());

  router.post("/esqueci-senha", (_req, res) =>
    res.status(200).json({ ok: true })
  );

  router.post("/reset-senha", (_req, res) =>
    res.status(501).json({
      erro: "Redefinição de senha depende do provedor de e-mail configurado.",
    })
  );

  return router;
}
