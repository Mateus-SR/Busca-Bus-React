import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INTERVALO_COLETA_MS } from "@busca-bus/core";

const diretorioServidor = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(diretorioServidor, "../../../.env") });

const split = (value) => (value || "").split(",").map((item) => item.trim()).filter(Boolean);

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  const config = {
    nodeEnv: env.NODE_ENV || "development",
    port: Number(env.PORT || 4000),
    host: env.HOST || "0.0.0.0",
    version: env.npm_package_version || "0.1.0",
    jwtSecret: env.JWT_SECRET || "",
    mongodbUri: env.MONGODB_URI || "",
    // Nome do banco. Tem prioridade sobre o nome presente na MONGODB_URI; se ficar vazio e a URI também não
    // trouxer um banco, o MongoDB usa o padrão "test".
    mongodbDb: (env.MONGODB_DB || "").trim(),
    allowedOrigins: split(env.ALLOWED_ORIGINS),
    appUrl: env.APP_URL || "",
    encryptionKey: env.ENCRYPTION_KEY || "",
    sptransToken: env.SPTRANS_DEFAULT_TOKEN || "",
    sptransBaseUrl: env.SPTRANS_BASE_URL || "https://api.olhovivo.sptrans.com.br/v2.1",
    sptransTimeoutMs: Number(env.SPTRANS_TIMEOUT_MS || 10000),
    pollIntervalMs: Number(env.POLL_INTERVALO_MS || INTERVALO_COLETA_MS),
    // Janela em que as atualizações das paradas de uma sala viram um único snapshot por cliente.
    coalescingMs: Number(env.COALESCING_MS || 500),
    // Simulação de falhas pelo painel (Detalhes técnicos). Ligada fora de produção; em produção só com SIMULACAO_FALHAS=1.
    simulacaoHabilitada: env.SIMULACAO_FALHAS ? env.SIMULACAO_FALHAS === "1" : !production,
    testDisplayCode: env.TEST_DISPLAY_CODE || "dev",
    testStopCodes: split(env.TEST_STOP_CODES || env.TEST_STOP_CODE || "650004840"),
  };
  config.testStopCode = config.testStopCodes[0];
  const required = production ? ["JWT_SECRET", "MONGODB_URI", "ALLOWED_ORIGINS"] : [];
  const missing = required.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}`);
  if (!config.jwtSecret) console.warn("[config] JWT_SECRET ausente: autenticação desabilitada.");
  if (!config.mongodbUri) console.warn("[config] MONGODB_URI ausente: rotas de banco retornam 503.");
  return config;
}
