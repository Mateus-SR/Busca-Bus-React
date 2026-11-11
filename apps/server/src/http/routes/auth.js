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


  router.post("/refresh", async (req, res, next) => {
    if (
      Usuario.db.readyState !== 1 ||
      !sessoes ||
      !config.jwtSecret
    ) {
      return unavailable(res);
    }

    try {
      const refreshToken = String(req.body?.refreshToken || "");

      if (!refreshToken) {
        return res.status(401).json({
          erro: "Token de renovação não informado.",
        });
      }

      const refreshHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      const sessao = await sessoes.findOne({
        refreshHash,
        expiraEm: { $gt: new Date() },
      });

      if (!sessao) {
        return res.status(401).json({
          erro: "Sessão inválida ou expirada. Faça login novamente.",
        });
      }

      const novoRefreshToken = crypto
        .randomBytes(32)
        .toString("base64url");

      const novoRefreshHash = crypto
        .createHash("sha256")
        .update(novoRefreshToken)
        .digest("hex");

      const resultado = await sessoes.updateOne(
        {
          _id: sessao._id,
          refreshHash,
          expiraEm: { $gt: new Date() },
        },
        {
          $set: {
            refreshHash: novoRefreshHash,
            atualizadoEm: new Date(),
          },
        }
      );

      if (resultado.modifiedCount !== 1) {
        return res.status(401).json({
          erro: "Sessão inválida ou já utilizada. Faça login novamente.",
        });
      }

      const usuario = await Usuario.findById(sessao.usuarioId);

      if (!usuario) {
        await sessoes.deleteOne({ _id: sessao._id });

        return res.status(401).json({
          erro: "Usuário não encontrado.",
        });
      }

      const accessToken = jwt.sign(
        {
          sub: usuario._id.toString(),
          role: usuario.role,
          sid: sessao._id.toString(),
        },
        config.jwtSecret,
        { expiresIn: "15m" }
      );

      return res.json({
        accessToken,
        refreshToken: novoRefreshToken,
        usuario: publicUser(usuario),
      });
    } catch (error) {
      return next(error);
    }
  });



  router.post("/logout", async (req, res, next) => {
    if (!sessoes) {
      return unavailable(res);
    }

    try {
      const refreshToken = String(req.body?.refreshToken || "");

      if (refreshToken) {
        const refreshHash = crypto
          .createHash("sha256")
          .update(refreshToken)
          .digest("hex");

        await sessoes.deleteOne({ refreshHash });
      }

      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });


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
          <!DOCTYPE html>
          <html lang="pt-BR">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Recuperação de senha - Busca Bus</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f5f5f5; color: #171717; font-family: Arial, Helvetica, sans-serif;">
              <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
                Redefina sua senha do Busca Bus.
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
                <tr>
                  <td align="center" style="padding: 32px 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                      <tr>
                        <td style="padding: 28px 32px; background-color: #b91c1c; color: #ffffff; text-align: center;">
                          <div style="font-size: 24px; font-weight: 700; letter-spacing: 0.02em;">Busca Bus</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 36px 32px 24px;">
                          <h1 style="margin: 0 0 20px; color: #171717; font-size: 24px; line-height: 1.3; font-weight: 700;">
                            Recuperação de senha
                          </h1>
                          <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
                            Olá, ${user.nome}!
                          </p>
                          <p style="margin: 0 0 28px; color: #374151; font-size: 16px; line-height: 1.6;">
                            Recebemos uma solicitação para redefinir a senha da sua conta no Busca Bus.
                          </p>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 28px;">
                            <tr>
                              <td align="center" style="border-radius: 8px; background-color: #dc2626;">
                                <a href="${link}" style="display: inline-block; padding: 14px 24px; border: 1px solid #dc2626; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 700; line-height: 1.2; text-decoration: none;">
                                  Redefinir minha senha
                                </a>
                              </td>
                            </tr>
                          </table>
                          <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Este link expira em 30 minutos.
                          </p>
                          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Se você não solicitou a recuperação, ignore este e-mail.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 32px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                          Este é um e-mail automático. Não responda a esta mensagem.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
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
