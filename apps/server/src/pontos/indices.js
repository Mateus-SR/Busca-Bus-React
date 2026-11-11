// Índices da coleção "pontos": 2dsphere para buscas por raio/área e texto para achar pontos por nome ou endereço.
// Nomes fixos tornam a criação idempotente (o MongoDB ignora um índice igual que já existe).
export function garantirIndicesPontos(collection) {
  return Promise.all([
    collection.createIndex({ loc: "2dsphere" }, { name: "pontos_loc" }),
    collection.createIndex(
      { nome: "text", endereco: "text" },
      { name: "pontos_texto", default_language: "portuguese", weights: { nome: 3, endereco: 1 } },
    ),
  ]);
}
