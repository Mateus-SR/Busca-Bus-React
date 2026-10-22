import { MongoClient } from "mongodb";

let client;
let database;

export async function connectDatabase(config) {
  if (!config.mongodbUri) return null;
  client = new MongoClient(config.mongodbUri);
  await client.connect();
  database = client.db();
  await Promise.all([
    database.collection("usuarios").createIndex({ email: 1 }, { unique: true }),
    database.collection("sessoes").createIndex({ refreshHash: 1 }, { unique: true }),
    database.collection("sessoes").createIndex({ expiraEm: 1 }, { expireAfterSeconds: 0 }),
    database.collection("reset_senha").createIndex({ expiraEm: 1 }, { expireAfterSeconds: 0 }),
  ]);
  return database;
}

export function getDatabase() { return database; }
export async function closeDatabase() {
  if (client) await client.close();
  client = undefined;
  database = undefined;
}
