import { Router } from "express";
import { AREA_SAO_PAULO, dentroDeSaoPaulo } from "@busca-bus/core";
import { criarPontosRepo } from "../../repos/pontos.js";

const RAIO_PADRAO_METROS = 200;
const RAIO_MINIMO_METROS = 20;
const RAIO_MAXIMO_METROS = 500;
const LIMITE_PROXIMOS = 50;
// Se o raio estiver vazio, procura o ponto mais próximo até esta distância para orientar o usuário.
const RAIO_MAIS_PROXIMO_METROS = 5000;
const LIMITE_AREA = 500;
// Lado máximo da área (em graus, ~11 km): comporta o mapa em zoom 15 em telas grandes e impede varreduras da cidade inteira.
const LADO_MAXIMO_AREA_GRAUS = 0.1;
const LIMITE_BUSCA = 20;
const TAMANHO_MINIMO_BUSCA = 3;
const TAMANHO_MAXIMO_BUSCA = 80;

// Query strings repetidas (?lat=1&lat=2) chegam como array; aceitamos só um número simples.
function numero(valor) {
  if (typeof valor !== "string" || valor.trim() === "") return NaN;
  return Number(valor);
}

const erroValidacao = (res, mensagem, codigo = "PARAMETRO_INVALIDO") => res.status(400).json({ erro: mensagem, codigo });

export function pontosRoutes(db) {
  const router = Router();
  const repo = criarPontosRepo(db);
  const semBanco = (res) => res.status(503).json({ erro: "Banco de dados indisponível." });

  // A URL carrega a localização de quem consulta: nada de cache compartilhado e nenhum log de coordenadas.
  router.get("/proximos", async (req, res, next) => {
    try {
      if (!repo.disponivel) return semBanco(res);
      const lat = numero(req.query.lat);
      const lng = numero(req.query.lng);
      const raio = req.query.raio === undefined ? RAIO_PADRAO_METROS : numero(req.query.raio);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return erroValidacao(res, "Informe lat e lng numéricos.");
      if (!dentroDeSaoPaulo(lat, lng)) {
        return erroValidacao(res, "A localização está fora da região de São Paulo coberta pelo Busca Bus.", "FORA_DA_AREA");
      }
      if (!Number.isFinite(raio) || raio < RAIO_MINIMO_METROS || raio > RAIO_MAXIMO_METROS) {
        return erroValidacao(res, `O raio deve estar entre ${RAIO_MINIMO_METROS} e ${RAIO_MAXIMO_METROS} metros.`);
      }
      const centro = { lat, lng };
      const pontos = await repo.proximos(centro, raio, LIMITE_PROXIMOS);
      const maisProximo = pontos.length ? null : await repo.maisProximo(centro, RAIO_MAIS_PROXIMO_METROS);
      res.set("Cache-Control", "private, no-store");
      return res.json({ raio, total: pontos.length, pontos, maisProximo });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/busca", async (req, res, next) => {
    try {
      if (!repo.disponivel) return semBanco(res);
      const termo = typeof req.query.q === "string" ? req.query.q.trim().replace(/\s+/g, " ") : "";
      if (termo.length < TAMANHO_MINIMO_BUSCA || termo.length > TAMANHO_MAXIMO_BUSCA) {
        return erroValidacao(res, `Digite de ${TAMANHO_MINIMO_BUSCA} a ${TAMANHO_MAXIMO_BUSCA} caracteres para buscar.`);
      }
      // Só dígitos = o usuário digitou um código de ponto; procuramos pelo código exato.
      const pontos = /^\d+$/.test(termo) ? await repo.buscarCodigo(termo) : await repo.buscarTexto(termo, LIMITE_BUSCA);
      res.set("Cache-Control", "public, max-age=3600");
      return res.json({ total: pontos.length, pontos });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      if (!repo.disponivel) return semBanco(res);
      const area = {
        norte: numero(req.query.norte),
        sul: numero(req.query.sul),
        leste: numero(req.query.leste),
        oeste: numero(req.query.oeste),
      };
      if (!Object.values(area).every(Number.isFinite)) return erroValidacao(res, "Informe norte, sul, leste e oeste numéricos.");
      if (area.sul >= area.norte || area.oeste >= area.leste) return erroValidacao(res, "A área informada é inválida.");
      if (area.norte - area.sul > LADO_MAXIMO_AREA_GRAUS || area.leste - area.oeste > LADO_MAXIMO_AREA_GRAUS) {
        return erroValidacao(res, "A área é grande demais; aproxime o mapa para ver os pontos.", "AREA_GRANDE");
      }
      const intersecta = area.leste >= AREA_SAO_PAULO.oeste && area.oeste <= AREA_SAO_PAULO.leste
        && area.norte >= AREA_SAO_PAULO.sul && area.sul <= AREA_SAO_PAULO.norte;
      res.set("Cache-Control", "public, max-age=3600");
      if (!intersecta) return res.json({ total: 0, truncado: false, pontos: [] });
      // Pedimos um a mais para saber se o resultado foi cortado pelo limite.
      const encontrados = await repo.naArea(area, LIMITE_AREA + 1);
      const truncado = encontrados.length > LIMITE_AREA;
      const pontos = truncado ? encontrados.slice(0, LIMITE_AREA) : encontrados;
      return res.json({ total: pontos.length, truncado, pontos });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
