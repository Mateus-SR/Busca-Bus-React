
import mongoose from "mongoose";
import { garantirIndicesPontos } from "./pontos/indices.js";

async function garantirIndice(collection, chave, opcoes = {}) {
  const nome = opcoes.name;
  if (!nome) return collection.createIndex(chave, opcoes);

  const indices = await collection.listIndexes().toArray();
  const existente = indices.find((indice) => indice.name === nome);
  if (existente) {
    const mesmaChave = JSON.stringify(existente.key) === JSON.stringify(chave);
    const mesmaUnicidade = Boolean(existente.unique) === Boolean(opcoes.unique);
    const mesmoFiltro =
      JSON.stringify(existente.partialFilterExpression || null) ===
      JSON.stringify(opcoes.partialFilterExpression || null);

    if (!mesmaChave || !mesmaUnicidade || !mesmoFiltro) {
      await collection.dropIndex(nome);
    } else {
      return nome;
    }
  }

  return collection.createIndex(chave, opcoes);
}

export async function connectDatabase(config) {
  if (!config.mongodbUri) return null;

  try {
    await mongoose.connect(
      config.mongodbUri,
      config.mongodbDb ? { dbName: config.mongodbDb } : {}
    );

    // Sem banco na URI e sem MONGODB_DB, o MongoDB cai no banco padrão "test".
    // Avisamos antes de criar os índices para não espalhar coleções no banco errado sem ninguém notar.
    if (mongoose.connection.name === "test" && config.mongodbDb !== "test") {
      console.warn(
        '[db] Conectado ao banco padrão "test". Defina MONGODB_DB ou inclua o nome do banco na MONGODB_URI (ex.: .../MeuBanco?retryWrites=true).'
      );
    }

    const database = mongoose.connection.db;

    const exibicoes = database.collection("exibicoes");
    const indicesExibicoes = await exibicoes.listIndexes().toArray();
    if (indicesExibicoes.some((indice) => indice.name === "codigo_1")) {
      await exibicoes.dropIndex("codigo_1");
    }

    await Promise.all([
      database.collection("Users").createIndex(
        { email: 1 },
        { unique: true }
      ),
      database.collection("sessoes").createIndex(
        { refreshHash: 1 },
        { unique: true }
      ),
      database.collection("sessoes").createIndex(
        { expiraEm: 1 },
        { expireAfterSeconds: 0 }
      ),
      database.collection("reset_senha").createIndex(
        { expiraEm: 1 },
        { expireAfterSeconds: 0 }
      ),
      garantirIndice(
        exibicoes,
        { codigo_exibicao: 1 },
        {
          name: "codigo_exibicao_unico",
          unique: true,
          partialFilterExpression: { codigo_exibicao: { $type: "string" } },
        }
      ),
      garantirIndice(
        database.collection("favoritos"),
        { usuarioId: 1, exibicaoId: 1 },
        {
          unique: true,
          name: "favorito_usuario_exibicao_unico",
          partialFilterExpression: {
            usuarioId: { $type: "objectId" },
            exibicaoId: { $type: "objectId" },
          },
        },
      ),
      garantirIndice(
        database.collection("favoritos"),
        { usuarioId: 1, criadoEm: -1 },
        { name: "favoritos_usuario_data" },
      ),
      database.collection("exibicoes").createIndex(
        { usuarioId: 1, ativo: 1 }
      ),
      garantirIndicesPontos(database.collection("pontos")),
    ]);

    console.log("MongoDB conectado com sucesso!");
    console.log("Banco utilizado:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);

    return database;
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    throw error;
  }
}

export function getDatabase() {
  return mongoose.connection.db;
}

export async function closeDatabase() {
  await mongoose.disconnect();
}
