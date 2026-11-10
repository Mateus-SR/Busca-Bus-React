import { ObjectId } from "mongodb";

function idsDoUsuario(usuarioId) {
  const ids = [usuarioId];
  if (ObjectId.isValid(usuarioId)) ids.push(new ObjectId(usuarioId));
  return ids;
}

function idMongo(valor) {
  return ObjectId.isValid(valor) ? new ObjectId(valor) : valor;
}

function normalizarExibicao(documento) {
  if (!documento) return null;
  return {
    codigo: documento.codigo_exibicao ?? documento.codigo,
    codigo_exib: documento.codigo_exibicao ?? documento.codigo,
    nome: documento.nome_exibicao ?? documento.nome ?? "",
    nome_exibicao: documento.nome_exibicao ?? documento.nome ?? "",
    paradas: documento.ponto ?? documento.paradas ?? [],
    instituicaoId: documento.fac_id?.toString?.() ?? documento.instituicaoId ?? null,
  };
}

export function criarFavoritosRepo(db) {
  const favoritos = db?.collection("favoritos");
  const exibicoes = db?.collection("exibicoes");
  const instituicoes = db?.collection("Fatec");

  async function buscarExibicao(codigo) {
    return exibicoes?.findOne({
      $or: [{ codigo_exibicao: codigo }, { codigo }],
      ativo: { $ne: false },
    });
  }

  async function enriquecerExibicao(documento) {
    const exibicao = normalizarExibicao(documento);
    if (!exibicao?.instituicaoId || !instituicoes) return exibicao;
    const instituicao = await instituicoes.findOne({ _id: idMongo(exibicao.instituicaoId) });
    return {
      ...exibicao,
      instituicao: instituicao?.nome || instituicao?.nome_fac || exibicao.instituicaoId,
    };
  }

  return {
    disponivel: Boolean(favoritos && exibicoes),
    async adicionar(usuarioId, codigo) {
      const exibicao = await buscarExibicao(codigo);
      if (!exibicao) return null;
      const filtro = {
        $or: [
          { usuarioId: { $in: idsDoUsuario(usuarioId) }, exibicaoId: exibicao._id },
          { usu_id: { $in: idsDoUsuario(usuarioId) }, exib_id: exibicao._id },
        ],
      };
      const existente = await favoritos.findOne(filtro);
      if (existente) return { exibicao: await enriquecerExibicao(exibicao), jaExistia: true };
      await favoritos.insertOne({
        usuarioId: idMongo(usuarioId),
        exibicaoId: exibicao._id,
        codigoExibicao: exibicao.codigo_exibicao ?? exibicao.codigo,
        criadoEm: new Date(),
      });
      return { exibicao: await enriquecerExibicao(exibicao), jaExistia: false };
    },
    async remover(usuarioId, codigo) {
      const exibicao = await buscarExibicao(codigo);
      if (!exibicao) return false;
      const resultado = await favoritos.deleteMany({
        $or: [
          { usuarioId: { $in: idsDoUsuario(usuarioId) }, exibicaoId: exibicao._id },
          { usu_id: { $in: idsDoUsuario(usuarioId) }, exib_id: exibicao._id },
        ],
      });
      return resultado.deletedCount > 0;
    },
    async verificar(usuarioId, codigo) {
      const exibicao = await buscarExibicao(codigo);
      if (!exibicao) return false;
      return Boolean(await favoritos.findOne({
        $or: [
          { usuarioId: { $in: idsDoUsuario(usuarioId) }, exibicaoId: exibicao._id },
          { usu_id: { $in: idsDoUsuario(usuarioId) }, exib_id: exibicao._id },
        ],
      }));
    },
    async listar(usuarioId) {
      const documentos = await favoritos.find({
        $or: [
          { usuarioId: { $in: idsDoUsuario(usuarioId) } },
          { usu_id: { $in: idsDoUsuario(usuarioId) } },
        ],
      }).sort({ criadoEm: -1, criado_em: -1 }).toArray();
      const itens = [];
      for (const favorito of documentos) {
        const exibicao = favorito.exibicaoId
          ? await exibicoes.findOne({ _id: favorito.exibicaoId, ativo: { $ne: false } })
          : await buscarExibicao(favorito.codigoExibicao);
        if (exibicao) itens.push(await enriquecerExibicao(exibicao));
      }
      return itens;
    },
  };
}
