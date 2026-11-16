import { test } from "node:test";
import assert from "node:assert/strict";
import { criarSeguidasStore } from "../src/store/index.js";
import { chaveSeguida, listarSeguidas } from "../src/index.js";

function criarStorageEmMemoria() {
  const dados = new Map();
  return {
    dados,
    getItem: (k) => dados.get(k) ?? null,
    setItem: (k, v) => dados.set(k, v),
    removeItem: (k) => dados.delete(k),
  };
}

const linha = { codigoLetreiro: "273D-10", sentidoLinha: "Metrô Arthur Alvim" };
const chave = chaveSeguida(linha.codigoLetreiro, linha.sentidoLinha);

test("seguir, atualizar e parar de seguir por exibição", () => {
  const store = criarSeguidasStore(criarStorageEmMemoria());
  store.getState().seguir(10, linha);
  store.getState().seguir("20", linha, { minutosChegando: 5 });

  let { seguidas } = store.getState();
  assert.equal(listarSeguidas(seguidas, 10).length, 1);
  assert.equal(listarSeguidas(seguidas, "10")[0].minutosChegando, 3);
  assert.equal(listarSeguidas(seguidas, 20)[0].minutosChegando, 5);
  assert.deepEqual(listarSeguidas(seguidas, 99), []);

  store.getState().atualizarSeguida(10, chave, { minutosChegando: 10, eventos: { saiu: true } });
  const alterada = listarSeguidas(store.getState().seguidas, 10)[0];
  assert.equal(alterada.minutosChegando, 10);
  assert.equal(alterada.eventos.saiu, true);
  assert.equal(alterada.eventos.chegando, true);
  assert.equal(listarSeguidas(store.getState().seguidas, 20)[0].eventos.saiu, false);

  store.getState().atualizarSeguida(10, "inexistente", { minutosChegando: 1 });
  store.getState().pararDeSeguir(10, chave);
  ({ seguidas } = store.getState());
  assert.deepEqual(listarSeguidas(seguidas, 10), []);
  assert.equal("10" in seguidas, false);
  assert.equal(listarSeguidas(seguidas, 20).length, 1);

  store.getState().limparSeguidas();
  assert.deepEqual(store.getState().seguidas, {});
});

test("persiste no storage injetado e reidrata em outro store", () => {
  const storage = criarStorageEmMemoria();
  criarSeguidasStore(storage).getState().seguir(10, linha);
  assert.ok(storage.dados.has("bus-seguidas-storage"));
  const outro = criarSeguidasStore(storage);
  assert.equal(listarSeguidas(outro.getState().seguidas, 10)[0].chave, chave);
});
