function normalizarVeiculo(veiculo, linha, codigoParada) {
  return {
    id: `${codigoParada}-${veiculo.p || veiculo.prefixo || veiculo.id || `${linha.c}-${veiculo.ta}`}`,
    codigoLetreiro: linha.c || linha.cl || "",
    sentidoLinha: linha.sl === 1 ? linha.lt0 : linha.lt1 || linha.lt0 || "",
    previsao: veiculo.t || null,
    status: "Normal",
    posicao: typeof veiculo.py === "number" && typeof veiculo.px === "number"
      ? { lat: veiculo.py, lng: veiculo.px }
      : undefined,
    atualizadoEm: new Date().toISOString(),
  };
}

export function normalizarPrevisao(resposta, codigoParada) {
  const onibusPorId = new Map();
  let duplicatas = 0;
  // Registros que foram sobrescritos por outro com o mesmo id (para o painel mostrar o que foi descartado).
  const duplicadosDescartados = [];
  const linhas = resposta?.linhas || resposta?.p?.l || [];
  for (const linha of linhas) {
    for (const veiculo of linha.vs || []) {
      const normalizado = normalizarVeiculo(veiculo, linha, codigoParada);
      const anterior = onibusPorId.get(normalizado.id);
      if (anterior) {
        duplicatas += 1;
        if (duplicadosDescartados.length < 50) {
          duplicadosDescartados.push({ id: anterior.id, codigoLetreiro: anterior.codigoLetreiro, previsao: anterior.previsao });
        }
      }
      onibusPorId.set(normalizado.id, normalizado);
    }
  }
  return {
    codigoParada,
    ponto: resposta?.p
      ? {
          codigo: resposta.p.cp,
          nome: resposta.p.np,
          posicao: { lat: resposta.p.py, lng: resposta.p.px },
        }
      : null,
    onibus: [...onibusPorId.values()],
    duplicatas,
    duplicadosDescartados,
    respostaBruta: resposta,
  };
}
