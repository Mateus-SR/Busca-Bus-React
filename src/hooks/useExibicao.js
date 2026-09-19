"use client";

import { useMemo } from "react";
import { EXIBICOES_MOCK } from "@/lib/fixtures/exibicoesFixture";
import { FIXTURE_ONIBUS } from "@/lib/fixtures/exibicaoFixture";

export default function useExibicao(codigo) {
  const exibicao = useMemo(() => EXIBICOES_MOCK.find((item) => item.codigo_exib === codigo) ?? {
    codigo_exib: codigo,
    nome_exibicao: "Exibição",
    codigos_parada: [],
    config: { tempo_atraso: 1, tempo_adiantado: 1, distanciaMinOnibus: 20 },
  }, [codigo]);
  return { exibicao, carregando: false, erro: null, onibus: FIXTURE_ONIBUS };
}
