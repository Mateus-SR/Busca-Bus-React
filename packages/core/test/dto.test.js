import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarExibicao } from "../src/index.js";

test("repassa temporaria e expiraEm da exibição temporária", () => {
  const exibicao = normalizarExibicao({ codigo: "ABC123", paradas: ["100"], temporaria: true, expiraEm: "2026-11-24T23:00:00.000Z" });
  assert.equal(exibicao.temporaria, true);
  assert.equal(exibicao.expiraEm, "2026-11-24T23:00:00.000Z");
});

test("aceita expira_em do formato antigo", () => {
  assert.equal(normalizarExibicao({ codigo: "A", temporaria: true, expira_em: "2026-11-24T23:00:00.000Z" }).expiraEm, "2026-11-24T23:00:00.000Z");
});

test("exibição comum não é temporária e não tem validade", () => {
  const exibicao = normalizarExibicao({ codigo: "ABC123", paradas: ["100"] });
  assert.equal(exibicao.temporaria, false);
  assert.equal(exibicao.expiraEm, null);
});
