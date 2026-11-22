import { test } from "node:test";
import assert from "node:assert/strict";
import { codigoParadaValido, limparCodigoParada } from "../src/index.js";

test("aceita códigos só de dígitos de 1 a 9, de qualquer tamanho", () => {
  for (const codigo of ["1", "18848", "260016", "4700001", "47000012", "470000123", 18848]) {
    assert.equal(codigoParadaValido(codigo), true, String(codigo));
  }
});

test("recusa vazio, letras, espaços e mais de 9 dígitos", () => {
  for (const codigo of ["", " ", "12a", "12 3", "-1", "1.5", "1234567890", null, undefined]) {
    assert.equal(codigoParadaValido(codigo), false, String(codigo));
  }
});

test("limparCodigoParada remove não dígitos e corta em 9", () => {
  assert.equal(limparCodigoParada("12-34 ab5"), "12345");
  assert.equal(limparCodigoParada("12345678901"), "123456789");
  assert.equal(limparCodigoParada(null), "");
});
