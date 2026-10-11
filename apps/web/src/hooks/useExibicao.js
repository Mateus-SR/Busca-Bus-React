"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizarExibicao } from "@busca-bus/core";
import { criarClienteApi } from "@busca-bus/core/cliente";
import { EXIBICOES_MOCK } from "@/lib/fixtures/exibicoesFixture";
import { FIXTURE_ONIBUS } from "@/lib/fixtures/exibicaoFixture";

export default function useExibicao(codigo) {
  const fixture = useMemo(() => EXIBICOES_MOCK.find((item) => item.codigo_exib === codigo) ?? {
    codigo_exib: codigo,
    nome_exibicao: "Exibição",
    codigos_parada: [],
    config: { tempo_atraso: 1, tempo_adiantado: 1, distanciaMinOnibus: 20 },
  }, [codigo]);
  const [exibicao, setExibicao] = useState(() => normalizarExibicao(fixture));
  const [carregando, setCarregando] = useState(Boolean(process.env.NEXT_PUBLIC_API_URL));
  const [erro, setErro] = useState(null);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL) return;
    const cliente = criarClienteApi(process.env.NEXT_PUBLIC_API_URL);
    cliente.obterExibicao(codigo)
      .then((resposta) => setExibicao(normalizarExibicao(resposta.exibicao)))
      .catch((erroApi) => setErro(erroApi.message))
      .finally(() => setCarregando(false));
  }, [codigo]);
  return { exibicao, carregando, erro, onibus: FIXTURE_ONIBUS };
}
