export function criarClienteApi(baseUrl) {
  const url = baseUrl?.replace(/\/$/, "");
  async function requisicao(path, opcoes) {
    if (!url) throw new Error("A URL base da API não foi configurada.");
    const resposta = await fetch(`${url}${path}`, opcoes);
    if (!resposta.ok) throw new Error(`Falha na API: ${resposta.status}`);
    return resposta.status === 204 ? null : resposta.json();
  }
  return {
    async listarLinhas() {
      return requisicao("/linhas");
    },
    obterExibicao: (codigo) => requisicao(`/v1/exibicoes/${encodeURIComponent(codigo)}`),
    obterRadar: (codigo, opcoes = {}) => {
      const parametros = new URLSearchParams();
      if (opcoes.diagnostico) parametros.set("diagnostico", "1");
      if (typeof opcoes.permitirMultiplosPorLinha === "boolean") {
        parametros.set("permitirMultiplosPorLinha", String(opcoes.permitirMultiplosPorLinha));
      }
      const query = parametros.toString();
      return requisicao(`/v1/exibicoes/${encodeURIComponent(codigo)}/radar${query ? `?${query}` : ""}`);
    },
  };
}
