import jwt from "jsonwebtoken";

export function exigirAutenticacao(config) {
  return (req, res, next) => {
    const cabecalho = req.headers.authorization || "";
    const [tipo, token] = cabecalho.split(" ");

    if (tipo !== "Bearer" || !token || !config.jwtSecret) {
      return res.status(401).json({ erro: "Autenticação necessária." });
    }

    try {
      const carga = jwt.verify(token, config.jwtSecret);
      req.usuarioId = carga.sub;
      return next();
    } catch {
      return res.status(401).json({ erro: "Sessão inválida ou expirada." });
    }
  };
}
