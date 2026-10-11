import http from "node:http";
import { loadConfig } from "./config.js";
import { connectDatabase, closeDatabase } from "./db.js";
import { createApp } from "./http/app.js";
import { createSocketServer } from "./realtime/socket.js";
import { criarClienteSptrans } from "./sptrans/cliente.js";
import { criarPoller } from "./realtime/poller.js";

const config = loadConfig();
const db = await connectDatabase(config);
const clienteSptrans = criarClienteSptrans(config);
const poller = criarPoller({ clienteSptrans, intervaloMs: config.pollIntervalMs });
const httpServer = http.createServer();
const io = createSocketServer(httpServer, config, poller);
httpServer.on("request", createApp(config, db, poller, io));

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
