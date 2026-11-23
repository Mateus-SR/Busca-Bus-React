import { test } from "node:test";
import assert from "node:assert/strict";
import { mesclarPontos } from "../src/index.js";

const GTFS = [
  { codigo: "100", nome: "Fatec Zona Leste", endereco: "Av. Exemplo, 10", lat: -23.5, lng: -46.4 },
  { codigo: "200", nome: "Metrô Itaquera", endereco: "Rua Teste, 20", lat: -23.6, lng: -46.5 },
];

test("GTFS vence o nome do radar e traz o endereço", () => {
  const [ponto] = mesclarPontos({
    radar: [{ codigo: "100", nome: "NOME DA SPTRANS", posicao: { lat: -23.51, lng: -46.41 } }],
    cadastro: GTFS,
  });
  assert.equal(ponto.nome, "Fatec Zona Leste");
  assert.equal(ponto.endereco, "Av. Exemplo, 10");
  assert.deepEqual(ponto.posicao, { lat: -23.51, lng: -46.41 });
});

test("sem o ponto no GTFS, mantém o nome do radar e fica sem endereço", () => {
  const [ponto] = mesclarPontos({ radar: [{ codigo: "999", nome: "Só no radar", posicao: { lat: -23.5, lng: -46.4 } }], cadastro: GTFS });
  assert.equal(ponto.nome, "Só no radar");
  assert.equal(ponto.endereco, null);
});

test("ponto vazio do radar (sem posição) usa nome e coordenadas do GTFS", () => {
  const [ponto] = mesclarPontos({ radar: [{ codigo: "200", nome: null, posicao: null }], cadastro: GTFS });
  assert.equal(ponto.nome, "Metrô Itaquera");
  assert.deepEqual(ponto.posicao, { lat: -23.6, lng: -46.5 });
});

test("nome vazio no GTFS cai para o do radar", () => {
  const [ponto] = mesclarPontos({
    radar: [{ codigo: "100", nome: "Do radar", posicao: null }],
    cadastro: [{ codigo: "100", nome: "  ", endereco: "", lat: -23.5, lng: -46.4 }],
  });
  assert.equal(ponto.nome, "Do radar");
  assert.equal(ponto.endereco, null);
});

test("mantém a ordem do radar (número e cor do ponto) e compara códigos como texto", () => {
  const lista = mesclarPontos({
    radar: [{ codigo: 200, nome: null, posicao: null }, { codigo: "100", nome: null, posicao: null }],
    cadastro: GTFS,
  });
  assert.deepEqual(lista.map((ponto) => ponto.codigo), ["200", "100"]);
  assert.equal(lista[0].nome, "Metrô Itaquera");
});

test("antes do radar chegar, usa as paradas da exibição", () => {
  const lista = mesclarPontos({ radar: [], cadastro: GTFS, paradas: ["100", "300"] });
  assert.deepEqual(lista.map((ponto) => ponto.codigo), ["100", "300"]);
  assert.equal(lista[0].nome, "Fatec Zona Leste");
  assert.equal(lista[1].nome, null);
  assert.equal(lista[1].posicao, null);
});

test("sem nada, devolve lista vazia e não quebra com entradas ausentes", () => {
  assert.deepEqual(mesclarPontos(), []);
  assert.deepEqual(mesclarPontos({ radar: [], cadastro: GTFS }), []);
});

test("posição inválida do radar é ignorada", () => {
  const [ponto] = mesclarPontos({ radar: [{ codigo: "100", posicao: { lat: null, lng: "x" } }], cadastro: GTFS });
  assert.deepEqual(ponto.posicao, { lat: -23.5, lng: -46.4 });
});
