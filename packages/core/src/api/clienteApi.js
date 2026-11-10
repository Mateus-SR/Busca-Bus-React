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
  async function requisicao(path, opcoes = {}) {
    if (!url) throw new Error("A URL base da API não foi configurada.");
    const { token, ...opcoesFetch } = opcoes;
    const headers = { ...(opcoesFetch.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    let resposta;
    try {
      resposta = await fetch(`${url}${path}`, { ...opcoesFetch, headers });
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
    criarExibicao: (dados, token) => requisicao("/v1/exibicoes", {
      method: "POST",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }),
    obterExibicoesUsuario: (token) => requisicao("/v1/exibicoes/usuario", { token }),
    excluirExibicao: (codigo, token) => requisicao(`/v1/exibicoes/${encodeURIComponent(codigo)}`, {
      method: "DELETE",
      token,
    }),
    atualizarExibicao: (codigo, dados, token) => requisicao(`/v1/exibicoes/${encodeURIComponent(codigo)}`, {
      method: "PUT",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    }),
    obterTokenSptrans: (token) => requisicao("/v1/me/token-sptrans", { token }),
    atualizarTokenSptrans: (tokenSptrans, token) => requisicao("/v1/me/token-sptrans", {
      method: "PUT",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenSptrans }),
    }),
    listarFavoritos: (token) => requisicao("/v1/me/favoritos", { token }),
    verificarFavorito: (codigo, token) => requisicao(`/v1/me/favoritos/${encodeURIComponent(codigo)}`, { token }),
    favoritar: (codigo, token) => requisicao(`/v1/me/favoritos/${encodeURIComponent(codigo)}`, {
      method: "POST",
      token,
    }),
    desfavoritar: (codigo, token) => requisicao(`/v1/me/favoritos/${encodeURIComponent(codigo)}`, {
      method: "DELETE",
      token,
    }),
    obterRadar: (codigo, opcoes = {}) => {
      const parametros = new URLSearchParams();
      if (opcoes.diagnostico) parametros.set("diagnostico", "1");
      if (typeof opcoes.permitirMultiplosPorLinha === "boolean") {
        parametros.set("permitirMultiplosPorLinha", String(opcoes.permitirMultiplosPorLinha));
      }
      const query = parametros.toString();
      return requisicao(`/v1/exibicoes/${encodeURIComponent(codigo)}/radar${query ? `?${query}` : ""}`, { token: opcoes.token });
    },
  };
}
