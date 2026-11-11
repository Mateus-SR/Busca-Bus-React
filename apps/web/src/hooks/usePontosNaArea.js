"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteApi } from "@busca-bus/core/cliente";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Abaixo deste zoom a tela cobre bairros demais: não consultamos e pedimos para aproximar o mapa.
export const ZOOM_MINIMO_GLOBAL = 15;
// O servidor recusa áreas com lado acima de 0,1°; depois de arredondar para a grade o lado pode crescer 0,01°.
const LADO_MAXIMO_VISAO = 0.085;
// Grade de arredondamento (~550 m): pequenos arrastos do mapa caem na mesma "caixa" e reaproveitam a consulta.
const PASSO_GRADE = 0.005;
const ESPERA_MS = 300;
const CAIXAS_GUARDADAS = 20;

const arredondar = (valor) => Number(valor.toFixed(3));

// Arredonda a área visível para fora, na grade, e devolve a caixa a consultar e a chave que a identifica.
export function caixaDaVisao({ norte, sul, leste, oeste }) {
  const n = Math.ceil(norte / PASSO_GRADE);
  const s = Math.floor(sul / PASSO_GRADE);
  const l = Math.ceil(leste / PASSO_GRADE);
  const o = Math.floor(oeste / PASSO_GRADE);
  return {
    chave: `${s}:${n}:${o}:${l}`,
    area: { norte: arredondar(n * PASSO_GRADE), sul: arredondar(s * PASSO_GRADE), leste: arredondar(l * PASSO_GRADE), oeste: arredondar(o * PASSO_GRADE) },
  };
}

export function visaoPermiteBusca(visao) {
  return Boolean(visao) && visao.zoom >= ZOOM_MINIMO_GLOBAL
    && visao.norte - visao.sul <= LADO_MAXIMO_VISAO && visao.leste - visao.oeste <= LADO_MAXIMO_VISAO;
}

// Pontos da área visível do mapa (modo "todos os pontos"). Guarda as últimas caixas consultadas e, enquanto a nova
// não chega, continua mostrando a anterior para o mapa não esvaziar a cada arrasto.
export default function usePontosNaArea(visao, ativo) {
  const [guardado, setGuardado] = useState({ caixas: {}, ultima: null });
  const [falha, setFalha] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  const consulta = ativo && API_URL && visaoPermiteBusca(visao) ? caixaDaVisao(visao) : null;
  const chave = consulta?.chave ?? null;
  const caixa = chave ? guardado.caixas[chave] : null;
  const jaTem = Boolean(caixa);

  useEffect(() => {
    if (!chave || jaTem) return undefined;
    const controlador = new AbortController();
    const idFalha = `${chave}|${tentativa}`;
    const temporizador = window.setTimeout(() => {
      criarClienteApi(API_URL)
        .obterPontosNaArea(consulta.area, { signal: controlador.signal })
        .then((dados) => {
          setFalha(null);
          setGuardado((atual) => {
            const chaves = Object.keys(atual.caixas).filter((existente) => existente !== chave).slice(-(CAIXAS_GUARDADAS - 1));
            const caixas = Object.fromEntries(chaves.map((existente) => [existente, atual.caixas[existente]]));
            caixas[chave] = { pontos: dados.pontos ?? [], truncado: Boolean(dados.truncado) };
            return { caixas, ultima: chave };
          });
        })
        .catch((erro) => {
          if (erro?.name === "AbortError") return;
          setFalha({ id: idFalha, mensagem: erro?.message || "Não foi possível buscar os pontos desta área." });
        });
    }, ESPERA_MS);
    return () => {
      window.clearTimeout(temporizador);
      controlador.abort();
    };
    // `consulta` é derivada de `chave`; só a chave decide quando consultar de novo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, jaTem, tentativa]);

  const recarregar = useCallback(() => setTentativa((atual) => atual + 1), []);
  const exibida = caixa ?? (guardado.ultima ? guardado.caixas[guardado.ultima] : null);
  const erro = chave && falha?.id === `${chave}|${tentativa}` ? falha.mensagem : null;

  return {
    pontos: exibida?.pontos ?? [],
    truncado: Boolean(caixa?.truncado),
    erro,
    carregando: Boolean(chave) && !caixa && !erro,
    recarregar,
  };
}
