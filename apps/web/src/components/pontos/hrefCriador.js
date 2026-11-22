// Endereço do criador de exibição com os pontos escolhidos no mapa.
// Quando a pessoa veio do criador (`origemCriador`), `rascunho=1` faz o formulário restaurar o que já tinha sido digitado;
// em edição, `editar` mantém o código da exibição que está sendo alterada.
export function montarHrefCriador(marcados, { origemCriador = false, codigoEdicao = null } = {}) {
  const parametros = new URLSearchParams(marcados.map((ponto) => ["parada", ponto.codigo]));
  if (origemCriador) parametros.set("rascunho", "1");
  if (origemCriador && codigoEdicao) parametros.set("editar", codigoEdicao);
  const consulta = parametros.toString();
  return consulta ? `/configuracao?${consulta}` : "/configuracao";
}
