
import mongoose from "mongoose";

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
