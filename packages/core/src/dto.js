export function normalizarExibicao(exibicao) {
  if (!exibicao) return null;
  return {
    codigo: exibicao.codigo ?? exibicao.codigo_exib,
    nome: exibicao.nome ?? exibicao.nome_exibicao ?? "Exibição",
    paradas: exibicao.paradas ?? exibicao.codigos_parada ?? [],
    instituicaoId: exibicao.instituicaoId ?? exibicao.instituicao ?? null,
    config: {
      tempoAtraso: exibicao.config?.tempoAtraso ?? exibicao.config?.tempo_atraso ?? 1,
      tempoAdiantado: exibicao.config?.tempoAdiantado ?? exibicao.config?.tempo_adiantado ?? 1,
      distanciaMaxMin: exibicao.config?.distanciaMaxMin ?? exibicao.config?.distanciaMinOnibus ?? 20,
      permitirMultiplosPorLinha: exibicao.config?.permitirMultiplosPorLinha
        ?? exibicao.config?.permitir_multiplos_por_linha
        ?? false,
    },
  };
}

export function normalizarOnibus(onibus) {
  return {
    ...onibus,
    codigoLetreiro: onibus.codigoLetreiro ?? onibus.codigo ?? onibus.linha ?? "",
    sentidoLinha: onibus.sentidoLinha ?? onibus.sentido ?? "",
    posicao: onibus.posicao ?? (
      typeof onibus.latitude === "number" && typeof onibus.longitude === "number"
        ? { lat: onibus.latitude, lng: onibus.longitude }
        : undefined
    ),
  };
}
