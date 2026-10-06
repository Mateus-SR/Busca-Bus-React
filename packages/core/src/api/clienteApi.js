export function criarClienteApi(baseUrl) {
  return {
    async listarLinhas() {
      if (!baseUrl) {
        throw new Error("A URL base da API não foi configurada.");
      }
      const resposta = await fetch(`${baseUrl.replace(/\/$/, "")}/linhas`);
      if (!resposta.ok) {
        throw new Error(`Falha ao buscar linhas: ${resposta.status}`);
      }
      return resposta.json();
    },
  };
}
