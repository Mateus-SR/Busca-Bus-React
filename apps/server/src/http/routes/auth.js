import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { Usuario } from "../../../models/Usuario.js";
import { validarEmail, validarSenha } from "@busca-bus/core";
import mongoose from "mongoose";

const LIMITE_NOME = 25;

const publicUser = (user) => ({
  id: user._id?.toString(),
  nome: user.nome,
  email: user.email,
  role: user.role,
  fac_id: user.fac_id?.toString() || null,
  avatarId: user.avatarId || null,
});

const unavailable = (res) =>
  res.status(503).json({
    erro: "Autenticação indisponível: configure MONGODB_URI e JWT_SECRET.",
  });

export function authRoutes({ config, db, servicoEmail }) {
  const router = Router();
  const sessoes = db?.collection("sessoes");
  const fatecs = db?.collection("Fatec");
  const resetSenhas = db?.collection("reset_senha");

  router.post("/cadastro", async (req, res, next) => {
    if (Usuario.db.readyState !== 1 || !config.jwtSecret) {
      return unavailable(res);
    }

    try {
      const { nome, email, senha, fac_id } = req.body || {};
      const nomeNormalizado = String(nome || "").trim();
      const normalized = String(email || "").trim().toLowerCase();

      if (
        !nomeNormalizado ||
        nomeNormalizado.length > LIMITE_NOME ||
        !validarEmail(normalized) ||
        !validarSenha(senha)
      ) {
        return res.status(400).json({
          erro: nomeNormalizado.length > LIMITE_NOME
            ? `O nome deve ter no máximo ${LIMITE_NOME} caracteres.`
            : "Dados de cadastro inválidos.",
        });
      }

      const facIdNormalizado = fac_id
        ? String(fac_id).trim()
        : null;

      if (
        facIdNormalizado &&
        !/^[a-fA-F0-9]{24}$/.test(facIdNormalizado)
      ) {
        return res.status(400).json({
          erro: "Instituição inválida.",
        });
      }

      let fatecSelecionada = null;

      if (facIdNormalizado) {
        if (!fatecs) {
          return unavailable(res);
        }

        fatecSelecionada = await fatecs.findOne({
          _id: new mongoose.Types.ObjectId(facIdNormalizado),
        });

        if (!fatecSelecionada) {
          return res.status(400).json({
            erro: "A instituição selecionada não existe.",
          });
        }
      }

      const existente = await Usuario.findOne({ email: normalized });

      if (existente) {
        return res.status(409).json({
          erro: "Este email já está cadastrado.",
        });
      }

      const user = await Usuario.create({
        nome: nomeNormalizado,
        email: normalized,
        senhaHash: await bcrypt.hash(senha, 12),
        role: "usuario",
        created_at: new Date(),
        fac_id: fatecSelecionada?._id || null,
      });

      return res.status(201).json({
        usuario: publicUser(user),
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          erro: "Este e-mail já está cadastrado.",
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

      if (!user) {
        return res.status(401).json({
          erro: "E-mail não cadastrado.",
        });
      }

      const senhaCorreta = await bcrypt.compare(
        String(req.body?.senha || ""),
        user.senhaHash
      );

      if (!senhaCorreta) {
        return res.status(401).json({
          erro: "Senha incorreta.",
        });
      }

      const refreshToken = crypto.randomBytes(32).toString("base64url");
      const sessao = await sessoes.insertOne({
        usuarioId: user._id,
        refreshHash: crypto
          .createHash("sha256")
          .update(refreshToken)
          .digest("hex"),
        familia: crypto.randomUUID(),
        expiraEm: new Date(Date.now() + 30 * 86400000),
        criadoEm: new Date(),
      });

      const accessToken = jwt.sign(
        {
          sub: user._id.toString(),
          role: user.role,
          sid: sessao.insertedId.toString(),
        },
        config.jwtSecret,
        { expiresIn: "15m" }
      );

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

  router.post("/esqueci-senha", async (req, res, next) => {
    if (
      Usuario.db.readyState !== 1 ||
      !resetSenhas ||
      !servicoEmail ||
      !config.appUrl
    ) {
      return unavailable(res);
    }

    try {
      const email = String(req.body?.email || "").trim().toLowerCase();

      if (!validarEmail(email)) {
        return res.status(400).json({
          erro: "Informe um e-mail válido.",
        });
      }

      const resposta = {
        mensagem: "Se o e-mail estiver cadastrado, você receberá um link de recuperação.",
      };

      const user = await Usuario.findOne({ email });

      if (!user) {
        return res.json(resposta);
      }

      const token = crypto.randomBytes(32).toString("hex");

      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      await resetSenhas.deleteMany({
        usuarioId: user._id,
      });

      await resetSenhas.insertOne({
        usuarioId: user._id,
        tokenHash,
        criadoEm: new Date(),
        expiraEm: new Date(Date.now() + 30 * 60 * 1000),
      });

      const link = `${config.appUrl.replace(/\/$/, "")}/redefinir-senha?token=${token}`;

      try {
        await servicoEmail.enviarEmail({
          para: user.email,
          assunto: "Recuperação de senha - BuscaBus",
          texto: `Olá, ${user.nome}! Acesse o link para redefinir sua senha: ${link}. O link expira em 30 minutos.`,
          html: `
          <h2>Recuperação de senha - BuscaBus</h2>
          <p>Olá, ${user.nome}!</p>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <p>
            <a href="${link}">Redefinir minha senha</a>
          </p>
          <p>Este link expira em 30 minutos.</p>
          <p>Se você não solicitou a recuperação, ignore este e-mail.</p>
        `,
        });
      } catch (error) {
        await resetSenhas.deleteOne({ tokenHash });
        throw error;
      }

      return res.json(resposta);
    } catch (error) {
      return next(error);
    }
  });

  router.post("/reset-senha", async (req, res, next) => {
    if (Usuario.db.readyState !== 1 || !resetSenhas) {
      return unavailable(res);
    }

    try {
      const token = String(req.body?.token || "").trim();
      const novaSenha = String(req.body?.senha || "");

      if (!token || !validarSenha(novaSenha)) {
        return res.status(400).json({
          erro: "Token ou nova senha inválidos.",
        });
      }

      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const registro = await resetSenhas.findOne({
        tokenHash,
        expiraEm: { $gt: new Date() },
      });

      if (!registro) {
        return res.status(400).json({
          erro: "Link de recuperação inválido ou expirado.",
        });
      }

      const usuario = await Usuario.findById(registro.usuarioId);

      if (!usuario) {
        await resetSenhas.deleteOne({ _id: registro._id });

        return res.status(400).json({
          erro: "Link de recuperação inválido ou expirado.",
        });
      }

      usuario.senhaHash = await bcrypt.hash(novaSenha, 12);
      await usuario.save();

      const resultadoSessoes = await sessoes.deleteMany({
        usuarioId: usuario._id,
      });

      console.log("[reset-senha] Usuário:", usuario._id.toString());
      console.log("[reset-senha] Sessões excluídas:", resultadoSessoes.deletedCount);

      await resetSenhas.deleteMany({
        usuarioId: usuario._id,
      });

      return res.json({
        mensagem: "Senha redefinida com sucesso.",
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
