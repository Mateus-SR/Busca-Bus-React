function normalizarExibicao(documento) {
  if (!documento) return null;
  return {
    ...documento,
    codigo: documento.codigo_exibicao ?? documento.codigo,
    usuarioId: documento.usu_id?.toString?.() ?? documento.usuarioId,
    nome: documento.nome_exibicao ?? documento.nome ?? "",
    instituicaoId: documento.fac_id?.toString?.() ?? documento.instituicaoId ?? null,
    paradas: documento.ponto ?? documento.paradas ?? [],
    config: {
      tempoAtraso: documento.tempo_atraso ?? documento.config?.tempoAtraso ?? 2,
      tempoAdiantado: documento.tempo_adiantado ?? documento.config?.tempoAdiantado ?? 2,
      distanciaMaxMin: documento.distancia_tempo ?? documento.config?.distanciaMaxMin ?? 20,
      permitirMultiplosPorLinha: Boolean(
        documento.varias_linhas ?? documento.config?.permitirMultiplosPorLinha,
      ),
    },
    criadoEm: documento.created_at ?? documento.criadoEm ?? null,
  };
}

export function criarExibicoesRepo(db) {
  const collection = db?.collection("exibicoes");
  const instituicoes = db?.collection("Fatec");
  async function enriquecerExibicao(exibicao) {
    if (!exibicao?.instituicaoId || !instituicoes) return exibicao;
    const instituicao = await instituicoes.findOne({ _id: idMongo(exibicao.instituicaoId) });
    return {
      ...exibicao,
      instituicao: instituicao?.nome || instituicao?.nome_fac || exibicao.instituicaoId,
    };
  }

  return {
    disponivel: Boolean(collection),
    async porCodigo(codigo) {
      return normalizarExibicao(await collection?.findOne({
        $or: [{ codigo_exibicao: codigo }, { codigo: codigo }, { codigo_exib: codigo }],
        ativo: { $ne: false },
      }));
    },
    async doUsuario(usuarioId) {
      if (!collection) return [];
      const documentos = await collection.find({
        $or: [{ usu_id: { $in: idsDoUsuario(usuarioId) } }, { usuarioId: { $in: idsDoUsuario(usuarioId) } }],
        ativo: { $ne: false },
      }).toArray();
      return Promise.all(documentos.map((documento) => enriquecerExibicao(normalizarExibicao(documento))));
    },
    async criar(exibicao) {
      if (!collection) return null;
      const documento = {
        usu_id: normalizarId(exibicao.usuarioId),
        fac_id: normalizarId(exibicao.instituicaoId),
        codigo_exibicao: exibicao.codigo,
        nome_exibicao: exibicao.nome,
        ponto: exibicao.paradas,
        distancia_tempo: exibicao.config.distanciaMaxMin,
        tempo_atraso: exibicao.config.tempoAtraso,
        tempo_adiantado: exibicao.config.tempoAdiantado,
        varias_linhas: exibicao.config.permitirMultiplosPorLinha,
        created_at: new Date(exibicao.criadoEm),
        last_update: new Date(exibicao.criadoEm),
        ativo: exibicao.ativo,
      };
      await collection.insertOne(documento);
      return normalizarExibicao(documento);
    },
    async atualizar(codigo, usuarioId, alteracoes) {
      if (!collection) return null;
      const resultado = await collection.findOneAndUpdate(
        {
          $and: [
            { $or: [{ codigo_exibicao: codigo }, { codigo }] },
            { $or: [{ usu_id: { $in: idsDoUsuario(usuarioId) } }, { usuarioId: { $in: idsDoUsuario(usuarioId) } }] },
            { ativo: { $ne: false } },
          ],
        },
        {
          $set: {
            nome_exibicao: alteracoes.nome,
            fac_id: alteracoes.instituicaoId,
            ponto: alteracoes.paradas,
            distancia_tempo: alteracoes.config.distanciaMaxMin,
            tempo_atraso: alteracoes.config.tempoAtraso,
            tempo_adiantado: alteracoes.config.tempoAdiantado,
            varias_linhas: alteracoes.config.permitirMultiplosPorLinha,
            last_update: new Date(),
          },
        },
        { returnDocument: "after" },
      );
      return normalizarExibicao(resultado?.value ?? resultado);
    },
    async excluir(codigo, usuarioId) {
      if (!collection) return null;
      const resultado = await collection.findOneAndUpdate(
        {
          $and: [
            { $or: [{ codigo_exibicao: codigo }, { codigo }] },
            { $or: [{ usu_id: { $in: idsDoUsuario(usuarioId) } }, { usuarioId: { $in: idsDoUsuario(usuarioId) } }] },
            { ativo: { $ne: false } },
          ],
        },
        { $set: { ativo: false, last_update: new Date() } },
        { returnDocument: "after" },
      );
      return normalizarExibicao(resultado?.value ?? resultado);
    },
  };
}
import { ObjectId } from "mongodb";

function idMongo(valor) {
  return valor && ObjectId.isValid(valor) ? new ObjectId(valor) : valor;
}

function idsDoUsuario(usuarioId) {
  const ids = [usuarioId];
  if (ObjectId.isValid(usuarioId)) ids.push(new ObjectId(usuarioId));
  return ids;
}

function normalizarId(valor) {
  return valor && ObjectId.isValid(valor) ? new ObjectId(valor) : valor;
}
