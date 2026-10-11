export function criarUsuariosRepo(db) {
  const collection = db?.collection("usuarios");
  return {
    disponivel: Boolean(collection),
    async porEmail(email) { return collection?.findOne({ email }); },
    async criar(usuario) {
      const result = await collection.insertOne(usuario);
      return { ...usuario, _id: result.insertedId };
    },
  };
}
