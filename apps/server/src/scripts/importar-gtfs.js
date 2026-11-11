// Importa o stops.txt do GTFS da SPTrans para a coleção "pontos".
// Uso: npm run importar-gtfs --workspace apps/server -- <caminho/stops.txt> [--simular] [--remover-ausentes]
//   --simular           lê e valida o arquivo, mostra o resumo e não grava nada (não precisa de banco)
//   --remover-ausentes  apaga os pontos que não estão no arquivo (use com o stops.txt completo)
// É idempotente: rodar de novo atualiza os pontos existentes em vez de duplicar.
import fs from "node:fs";
import { MongoClient } from "mongodb";
import { loadConfig } from "../config.js";
import { lerCsv, registroParaPonto } from "../pontos/gtfs.js";
import { garantirIndicesPontos } from "../pontos/indices.js";

const TAMANHO_LOTE = 1000;
const MINIMO_PARA_REMOVER = 1000;

const argumentos = process.argv.slice(2);
const opcoes = new Set(argumentos.filter((argumento) => argumento.startsWith("--")));
const [caminho] = argumentos.filter((argumento) => !argumento.startsWith("--"));

if (!caminho) {
  console.error("Informe o caminho do stops.txt. Ex.: npm run importar-gtfs --workspace apps/server -- ./stops.txt");
  process.exit(1);
}

const registros = lerCsv(fs.readFileSync(caminho, "utf8"));
const pontos = new Map();
const descartes = new Map();
for (const registro of registros) {
  const { ponto, descartado } = registroParaPonto(registro);
  if (ponto) pontos.set(ponto._id, ponto);
  else descartes.set(descartado, (descartes.get(descartado) ?? 0) + 1);
}
const totalDescartados = [...descartes.values()].reduce((soma, quantidade) => soma + quantidade, 0);
const duplicados = registros.length - totalDescartados - pontos.size;

console.log(`Linhas lidas: ${registros.length}`);
console.log(`Pontos válidos: ${pontos.size}${duplicados > 0 ? ` (${duplicados} stop_id repetidos, vale o último)` : ""}`);
for (const [motivo, quantidade] of descartes) console.log(`Descartados (${motivo}): ${quantidade}`);

if (opcoes.has("--simular")) {
  console.log("Modo --simular: nada foi gravado.");
  process.exit(0);
}
if (!pontos.size) {
  console.error("Nenhum ponto válido encontrado; nada a importar.");
  process.exit(1);
}

const config = loadConfig();
if (!config.mongodbUri) {
  console.error("MONGODB_URI não configurada.");
  process.exit(1);
}

const cliente = new MongoClient(config.mongodbUri);
try {
  await cliente.connect();
  const banco = cliente.db(config.mongodbDb || undefined);
  const collection = banco.collection("pontos");
  const inicio = new Date();
  console.log(`Banco: ${banco.databaseName}`);

  const lista = [...pontos.values()];
  for (let i = 0; i < lista.length; i += TAMANHO_LOTE) {
    const lote = lista.slice(i, i + TAMANHO_LOTE).map(({ _id, ...dados }) => ({
      updateOne: { filter: { _id }, update: { $set: { ...dados, atualizadoEm: inicio } }, upsert: true },
    }));
    await collection.bulkWrite(lote, { ordered: false });
    console.log(`Gravados ${Math.min(i + TAMANHO_LOTE, lista.length)}/${lista.length}`);
  }

  await garantirIndicesPontos(collection);

  if (opcoes.has("--remover-ausentes")) {
    if (pontos.size < MINIMO_PARA_REMOVER) {
      console.warn(`Arquivo com menos de ${MINIMO_PARA_REMOVER} pontos: --remover-ausentes ignorado por segurança.`);
    } else {
      const { deletedCount } = await collection.deleteMany({ atualizadoEm: { $lt: inicio } });
      console.log(`Pontos removidos por não estarem no arquivo: ${deletedCount}`);
    }
  }
  console.log(`Total na coleção: ${await collection.countDocuments()}`);
} finally {
  await cliente.close();
}
