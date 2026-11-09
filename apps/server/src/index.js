import http from "node:http";
import { loadConfig } from "./config.js";
import { connectDatabase, closeDatabase } from "./db.js";
import { createApp } from "./http/app.js";
import { createSocketServer } from "./realtime/socket.js";
import { criarClienteSptrans } from "./sptrans/cliente.js";
import { criarSimulador } from "./sptrans/simulador.js";
import { criarPoller } from "./realtime/poller.js";
import { criarServicoEmail } from "./services/email.js";

const config = loadConfig();
const servicoEmail = criarServicoEmail(config);

console.log("[email] SMTP:", {
  host: config.smtpHost || "ausente",
  port: config.smtpPort,
  secure: config.smtpSecure,
  userConfigurado: Boolean(config.smtpUser),
  senhaConfigurada: Boolean(config.smtpPass),
  remetenteConfigurado: Boolean(config.emailFrom),
});

if (config.smtpHost && config.smtpUser && config.smtpPass) {
  servicoEmail.verificarConexao().catch((error) => {
    console.error("[email] Falha na conexão SMTP:", error.message);
  });
} else {
  console.warn("[email] Configurações SMTP não encontradas.");
}
const db = await connectDatabase(config);
const clienteSptransReal = criarClienteSptrans(config);
const simulador = config.simulacaoHabilitada
  ? criarSimulador(clienteSptransReal, { timeoutMs: config.sptransTimeoutMs })
  : null;
const clienteSptrans = simulador ?? clienteSptransReal;
const poller = criarPoller({ clienteSptrans, intervaloMs: config.pollIntervalMs });
const httpServer = http.createServer();
const io = createSocketServer(httpServer, config, poller, simulador);
httpServer.on("request", createApp(config, db, poller, io, servicoEmail));

httpServer.listen(config.port, config.host, () => console.log(`Servidor ouvindo em ${config.host}:${config.port}`));

async function shutdown(signal) {
  console.log(`${signal}: encerrando servidor...`);
  io.emit("servidor:aviso", { tipo: "reiniciando", mensagem: "Servidor reiniciando." });
  io.close();
  await new Promise((resolve) => httpServer.close(resolve));
  await closeDatabase();
  process.exit(0);
}
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
