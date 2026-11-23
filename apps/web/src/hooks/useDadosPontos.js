"use client";

import { useEffect, useState } from "react";
import { LIMITE_PARADAS_EXIBICAO, codigoParadaValido } from "@busca-bus/core";
import { criarClienteApi } from "@busca-bus/core/cliente";

const SEM_DADOS = [];

// Nome, endereço e coordenadas (GTFS) dos pontos de uma exibição, pelo mesmo endpoint do Buscar Pontos.
// É um complemento: se a API estiver fora ou o ponto não existir no cadastro, devolve o que tiver e a tela
// continua com os dados do radar.
export default function useDadosPontos(codigos) {
  const chave = (codigos ?? [])
    .map(String)
    .filter(codigoParadaValido)
    .slice(0, LIMITE_PARADAS_EXIBICAO)
    .join(",");
  const [resultado, setResultado] = useState({ chave: "", pontos: SEM_DADOS });

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl || !chave) return undefined;
    const controlador = new AbortController();
    criarClienteApi(apiUrl)
      .obterPontosPorCodigos(chave.split(","), { signal: controlador.signal })
      .then(({ pontos = [] }) => setResultado({ chave, pontos }))
      .catch(() => {});
    return () => controlador.abort();
  }, [chave]);

  // Resposta de outra lista de códigos (a exibição mudou) não vale para esta.
  return resultado.chave === chave ? resultado.pontos : SEM_DADOS;
}
