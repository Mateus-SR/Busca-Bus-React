"use client";

import { useEffect, useState } from "react";
import { criarClienteApi } from "@busca-bus/core/cliente";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TAMANHO_MINIMO = 3;
const ESPERA_MS = 400;

// Busca por nome, endereço ou código (só dígitos). Espera o usuário parar de digitar e cancela a consulta anterior.
export default function useBuscaPontos(texto) {
  const [resultado, setResultado] = useState(null);
  const termo = texto.trim().replace(/\s+/g, " ");
  const valido = Boolean(API_URL) && termo.length >= TAMANHO_MINIMO;

  useEffect(() => {
    if (!valido) return undefined;
    const controlador = new AbortController();
    const temporizador = window.setTimeout(() => {
      criarClienteApi(API_URL)
        .buscarPontos(termo, { signal: controlador.signal })
        .then((dados) => setResultado({ termo, pontos: dados.pontos ?? [], erro: null }))
        .catch((erro) => {
          if (erro?.name === "AbortError") return;
          setResultado({ termo, pontos: [], erro: erro?.message || "Não foi possível buscar." });
        });
    }, ESPERA_MS);
    return () => {
      window.clearTimeout(temporizador);
      controlador.abort();
    };
  }, [termo, valido]);

  const atual = valido && resultado?.termo === termo ? resultado : null;
  return {
    pontos: atual?.pontos ?? [],
    erro: atual?.erro ?? null,
    carregando: valido && !atual,
    consultou: Boolean(atual) && !atual.erro,
    curto: termo.length > 0 && termo.length < TAMANHO_MINIMO,
  };
}
