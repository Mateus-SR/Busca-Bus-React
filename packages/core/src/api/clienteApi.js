class ApiError extends Error {
  constructor(message, status, codigo, detalhe) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.codigo = codigo;
    this.detalhe = detalhe;
  }
}

export function criarClienteApi(baseUrl) {
  const url = baseUrl?.replace(/\/$/, "");
  async function requisicao(path, opcoes) {
    if (!url) throw new Error("A URL base da API não foi configurada.");
    let resposta;
    try {
      resposta = await fetch(`${url}${path}`, opcoes);
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw new ApiError("Não foi possível conectar ao servidor.", undefined, "REDE", { cause: error });
    }
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      throw new ApiError(
        dados.erro || dados.mensagem || `Falha na API: ${resposta.status}`,
        resposta.status,
        undefined,
        dados,
      );
    }
    return resposta.status === 204 ? null : resposta.json();
  }
  return {
    async listarLinhas() {
      return requisicao("/linhas");
    },
    obterExibicao: (codigo) => requisicao(`/v1/exibicoes/${encodeURIComponent(codigo)}`),
    obterHealth: () => requisicao("/v1/health"),
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
