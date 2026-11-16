import { test } from "node:test";
import assert from "node:assert/strict";
import {
  criarEstadoDeteccao,
  criarSeguida,
  chaveSeguida,
  detectarEventos,
  montarNotificacoes,
  normalizarConfigSeguida,
  CICLOS_PARA_SAIR,
} from "../src/index.js";

const AGORA = 14 * 60; // 14:00
const linha = { codigoLetreiro: "273D-10", sentidoLinha: "Metrô Arthur Alvim" };
const seguida = (config) => criarSeguida(linha, config);
const onibus = (id, extras = {}) => ({
  id, ...linha, previsao: "14:20", status: "Normal", codigoParada: "700", ...extras,
});
const ciclo = (estado, lista, seguidas = [seguida()]) => detectarEventos(estado, lista, seguidas, { agoraMin: AGORA });

test("chaveSeguida ignora caixa e espaços", () => {
  assert.equal(chaveSeguida(" 273d-10 ", "metrô  arthur alvim"), chaveSeguida("273D-10", "METRÔ ARTHUR ALVIM"));
  assert.notEqual(chaveSeguida("273D-10", "A"), chaveSeguida("273D-10", "B"));
});

test("normalizarConfigSeguida usa padrões e descarta valores inválidos", () => {
  const config = normalizarConfigSeguida({ minutosChegando: 7, eventos: { saiu: true, status: "sim" } });
  assert.equal(config.minutosChegando, 3);
  assert.equal(config.eventos.saiu, true);
  assert.equal(config.eventos.status, true);
  assert.equal(normalizarConfigSeguida({ minutosChegando: "10" }).minutosChegando, 10);
});

test("primeiro lote é só linha de base e não gera eventos", () => {
  const { estado, eventos } = ciclo(criarEstadoDeteccao(), [onibus("a", { previsao: "14:02" })]);
  assert.deepEqual(eventos, []);
  assert.equal(estado.inicializado, true);
  // já estava chegando na abertura: não notifica depois
  assert.deepEqual(ciclo(estado, [onibus("a", { previsao: "14:02" })]).eventos, []);
});

test("apareceu dispara uma vez e só para linhas seguidas", () => {
  let { estado } = ciclo(criarEstadoDeteccao(), []);
  const outra = { id: "x", codigoLetreiro: "999", sentidoLinha: "Outro", previsao: "14:30", status: "Normal" };
  let r = ciclo(estado, [onibus("a"), outra]);
  assert.deepEqual(r.eventos.map((e) => [e.tipo, e.id]), [["apareceu", "a"]]);
  r = ciclo(r.estado, [onibus("a"), outra]);
  assert.deepEqual(r.eventos, []);
});

test("chegando dispara ao cruzar o limite escolhido, uma única vez", () => {
  let { estado } = ciclo(criarEstadoDeteccao(), [onibus("a", { previsao: "14:10" })]);
  let r = ciclo(estado, [onibus("a", { previsao: "14:04" })]);
  assert.deepEqual(r.eventos, []);
  r = ciclo(r.estado, [onibus("a", { previsao: "14:03" })]);
  assert.deepEqual(r.eventos.map((e) => e.tipo), ["chegando"]);
  assert.equal(r.eventos[0].minutos, 3);
  r = ciclo(r.estado, [onibus("a", { previsao: "14:02" })]);
  assert.deepEqual(r.eventos, []);
});

test("chegando respeita o N escolhido e previsão inválida não quebra", () => {
  const cinco = [seguida({ minutosChegando: 5 })];
  let { estado } = ciclo(criarEstadoDeteccao(), [onibus("a", { previsao: "14:20" })], cinco);
  let r = ciclo(estado, [onibus("a", { previsao: null })], cinco);
  assert.deepEqual(r.eventos, []);
  r = ciclo(r.estado, [onibus("a", { previsao: "14:05" })], cinco);
  assert.deepEqual(r.eventos.map((e) => e.tipo), ["chegando"]);
});

test("previsão já passada (dia anterior no módulo) não conta como chegando", () => {
  let { estado } = ciclo(criarEstadoDeteccao(), [onibus("a", { previsao: "14:20" })]);
  const r = ciclo(estado, [onibus("a", { previsao: "13:58" })]);
  assert.deepEqual(r.eventos, []);
});

test("status notifica ao virar Atrasado/Adiantado, não ao voltar a Normal", () => {
  let { estado } = ciclo(criarEstadoDeteccao(), [onibus("a")]);
  let r = ciclo(estado, [onibus("a", { status: "Atrasado" })]);
  assert.deepEqual(r.eventos.map((e) => [e.tipo, e.statusAnterior]), [["status", "Normal"]]);
  r = ciclo(r.estado, [onibus("a", { status: "Atrasado" })]);
  assert.deepEqual(r.eventos, []);
  r = ciclo(r.estado, [onibus("a", { status: "Normal" })]);
  assert.deepEqual(r.eventos, []);
  r = ciclo(r.estado, [onibus("a", { status: "Adiantado" })]);
  assert.deepEqual(r.eventos.map((e) => e.tipo), ["status"]);
});

test("saiu vem desligado por padrão e respeita a tolerância de piscadas", () => {
  const comSaiu = [seguida({ eventos: { saiu: true } })];
  let { estado } = ciclo(criarEstadoDeteccao(), [onibus("a")], comSaiu);
  // piscou por um ciclo e voltou: nada
  let r = ciclo(estado, [], comSaiu);
  assert.equal(CICLOS_PARA_SAIR, 2);
  assert.deepEqual(r.eventos, []);
  r = ciclo(r.estado, [onibus("a")], comSaiu);
  assert.deepEqual(r.eventos, []);
  // sumiu de vez
  r = ciclo(r.estado, [], comSaiu);
  r = ciclo(r.estado, [], comSaiu);
  assert.deepEqual(r.eventos.map((e) => e.tipo), ["saiu"]);
  assert.deepEqual(r.estado.registros, {});
  // padrão (desligado): não notifica
  ({ estado } = ciclo(criarEstadoDeteccao(), [onibus("b")]));
  r = ciclo(estado, []);
  r = ciclo(r.estado, []);
  assert.deepEqual(r.eventos, []);
});

test("ônibus que volta depois de sair é tratado como novo", () => {
  let { estado } = ciclo(criarEstadoDeteccao(), [onibus("a")]);
  let r = ciclo(estado, []);
  r = ciclo(r.estado, []);
  r = ciclo(r.estado, [onibus("a")]);
  assert.deepEqual(r.eventos.map((e) => e.tipo), ["apareceu"]);
});

test("eventos desligados na seguida não são gerados", () => {
  const sem = [seguida({ eventos: { apareceu: false, chegando: false, status: false } })];
  let { estado } = ciclo(criarEstadoDeteccao(), [], sem);
  const r = ciclo(estado, [onibus("a", { previsao: "14:01", status: "Atrasado" })], sem);
  assert.deepEqual(r.eventos, []);
});

test("seguir uma linha depois da linha de base notifica o que já está chegando", () => {
  let { estado } = ciclo(criarEstadoDeteccao(), [onibus("a", { previsao: "14:02" })], []);
  const r = ciclo(estado, [onibus("a", { previsao: "14:02" })]);
  assert.deepEqual(r.eventos.map((e) => e.tipo), ["chegando"]);
});

test("não altera o estado recebido e tolera entradas vazias", () => {
  const base = ciclo(criarEstadoDeteccao(), [onibus("a")]).estado;
  const copia = structuredClone(base);
  ciclo(base, [onibus("a", { status: "Atrasado" })]);
  assert.deepEqual(base, copia);
  assert.deepEqual(detectarEventos(undefined, undefined, undefined, { agoraMin: AGORA }).eventos, []);
  assert.deepEqual(ciclo(base, [{ previsao: "14:00" }, onibus("a"), onibus("a")]).eventos, []);
});

test("montarNotificacoes monta título e corpo no formato combinado", () => {
  let { estado } = ciclo(criarEstadoDeteccao(), [onibus("a", { previsao: "14:10" })]);
  const { eventos } = ciclo(estado, [onibus("a", { previsao: "14:03" })]);
  const [n] = montarNotificacoes(eventos, { nomePonto: (cod) => (cod === "700" ? "Fatec Zona Leste" : null) });
  assert.equal(n.titulo, "Linha 273D-10 · chegando");
  assert.equal(n.corpo, "Sentido Metrô Arthur Alvim · previsão 14:03 · Ponto Fatec Zona Leste");
  assert.equal(n.tag, "chegando:a");
  assert.equal(montarNotificacoes(eventos)[0].corpo, "Sentido Metrô Arthur Alvim · previsão 14:03");
  assert.deepEqual(montarNotificacoes([]), []);
});

test("montarNotificacoes usa o status no título e agrupa acima do limite", () => {
  const evento = { tipo: "status", id: "a", codigoLetreiro: "273D-10", sentidoLinha: "X", previsao: "14:10", status: "Atrasado" };
  assert.equal(montarNotificacoes([evento])[0].titulo, "Linha 273D-10 · atrasado");
  const muitos = ["1", "2", "3", "4"].map((id) => ({ ...evento, id, codigoLetreiro: id === "4" ? "9" : "273D-10" }));
  const agrupadas = montarNotificacoes(muitos);
  assert.equal(agrupadas.length, 1);
  assert.equal(agrupadas[0].titulo, "4 atualizações nas linhas que você segue");
  assert.equal(agrupadas[0].corpo, "Linhas 273D-10, 9");
  assert.equal(agrupadas[0].eventos.length, 4);
  assert.equal(montarNotificacoes(muitos.slice(0, 3)).length, 3);
});
