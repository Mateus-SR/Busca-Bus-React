import { Router } from "express";

export function healthRoute(config, db) {
  const router = Router();
  router.get("/", (_req, res) => res.json({
    ok: true,
    versao: config.version,
    ambiente: config.nodeEnv,
    banco: db ? "conectado" : "nao_configurado",
    memoria: process.memoryUsage(),
    agora: new Date().toISOString(),
  }));
  return router;
}
