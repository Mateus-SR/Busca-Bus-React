export function criarExibicoesRepo(db) {
  const collection = db?.collection("exibicoes");
  return {
    disponivel: Boolean(collection),
    async porCodigo(codigo) { return collection?.findOne({ codigo, ativo: { $ne: false } }); },
    async doUsuario(usuarioId) { return collection ? collection.find({ usuarioId }).toArray() : []; },
  };
}
