import { Router } from "express";

export function meRoutes() {
  const router = Router();
  const indisponivel = (_req, res) => res.status(501).json({ erro: "Autenticação necessária para este recurso." });
  router.get("/", indisponivel);
  router.put("/token-sptrans", indisponivel);
  router.delete("/", indisponivel);
  router.get("/exibicoes", indisponivel);
  router.get("/favoritos", indisponivel);
  router.post("/favoritos/:codigo", indisponivel);
  router.delete("/favoritos/:codigo", indisponivel);
  return router;
}
