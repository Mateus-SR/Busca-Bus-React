
import nodemailer from "nodemailer";

export function criarServicoEmail(config) {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  async function verificarConexao() {
    await transporter.verify();
    console.log("Servidor de e-mail conectado com sucesso!");
  }

  async function enviarEmail({ para, assunto, texto, html }) {
    try {
      const resultado = await transporter.sendMail({
        from: config.emailFrom,
        to: para,
        subject: assunto,
        text: texto,
        html,
      });
      console.log("[email] Mensagem enviada com sucesso.", {
        messageId: resultado.messageId,
      });
      return resultado;
    } catch (error) {
      console.error("[email] Falha ao enviar mensagem:", {
        code: error.code,
        responseCode: error.responseCode,
        command: error.command,
        message: error.message,
      });
      throw error;
    }
  }

  return {
    verificarConexao,
    enviarEmail,
  };
}