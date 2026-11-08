
import { Router } from "express";

export function fatecsRoutes(db) {
  const router = Router();
  const collection = db?.collection("Fatec");

  router.get("/", async (_req, res, next) => {
    try {
      if (!collection) {
        return res.status(503).json({
          erro: "Banco de dados indisponível.",
        });
      }

      const fatecs = await collection
        .find({})
        .sort({ nome: 1 })
        .toArray();

      return res.json({
        fatecs: fatecs.map((fatec) => ({
          id_fac: fatec._id.toString(),
          nome_fac: fatec.nome,
          municipio: fatec.municipio,
          sigla: fatec.sigla,
        })),
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
