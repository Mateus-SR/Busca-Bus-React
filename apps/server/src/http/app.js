import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { healthRoute } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { exibicoesRoutes } from "./routes/exibicoes.js";
import { meRoutes } from "./routes/me.js";

export function createApp(config, db, poller, io = null) {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: config.allowedOrigins.length ? config.allowedOrigins : true, credentials: false }));
  app.use(express.json({ limit: "64kb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));
  app.use("/v1/health", healthRoute(config, db));
  app.use("/v1/auth", rateLimit({ windowMs: 15 * 60_000, limit: 30 }), authRoutes({ config, db }));
  app.use("/v1/exibicoes", exibicoesRoutes(db, config, poller, io));
  app.use("/v1/me", meRoutes());
  app.get("/v1/paradas/:codigo/validar", async (req, res, next) => {
    try {
      const snapshot = await poller.consultar(req.params.codigo);
      return res.json({ valido: !snapshot.erro, codigo: req.params.codigo, erro: snapshot.erro });
    } catch (error) {
      return next(error);
    }
  });
  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ erro: "Erro interno do servidor." });
  });
  return app;
}
