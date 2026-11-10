"use client";

import { useCallback, useEffect, useState } from "react";
import { criarClienteApi } from "@busca-bus/core/cliente";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Busca na API os pontos perto de `posicao` (no raio em metros). Cancela a consulta anterior quando a posição ou o raio mudam.
// Enquanto a nova consulta não volta, mantém o resultado anterior na tela (`carregando` avisa) para o mapa não piscar.
export default function usePontosProximos(posicao, raio) {
  const [resultado, setResultado] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const lat = posicao?.lat;
  const lng = posicao?.lng;
  const chave = lat == null || lng == null || !API_URL ? null : `${lat.toFixed(5)},${lng.toFixed(5)},${raio},${tentativa}`;

  useEffect(() => {
    if (!chave) return undefined;
    const controlador = new AbortController();
    criarClienteApi(API_URL)
      .obterPontosProximos({ lat, lng, raio }, { signal: controlador.signal })
      .then((dados) => setResultado({ chave, pontos: dados.pontos ?? [], maisProximo: dados.maisProximo ?? null, erro: null }))
      .catch((erro) => {
        if (erro?.name === "AbortError") return;
        setResultado({ chave, pontos: [], maisProximo: null, erro: erro?.message || "Não foi possível buscar os pontos." });
      });
    return () => controlador.abort();
  }, [chave, lat, lng, raio]);

  const recarregar = useCallback(() => setTentativa((atual) => atual + 1), []);
  const atual = resultado?.chave === chave ? resultado : null;

  return {
    pontos: resultado?.pontos ?? [],
    maisProximo: atual?.maisProximo ?? null,
    erro: !API_URL && posicao ? "O servidor não está configurado neste ambiente (NEXT_PUBLIC_API_URL)." : (atual?.erro ?? null),
    carregando: Boolean(chave) && !atual,
    // Só vale para o resultado da consulta atual: depois de um erro ou de mudar o raio, não afirmamos "nenhum ponto".
    consultou: Boolean(atual) && !atual.erro,
    recarregar,
  };
}
