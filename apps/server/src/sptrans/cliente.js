const COOKIE_HEADER = "set-cookie";

export class SptransError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "SptransError";
    this.status = status;
  }
}

export function criarClienteSptrans(config) {
  let cookie = "";
  let autenticacaoEmAndamento = null;
  let autenticacoes = 0;
  let renovacoes = 0;
  let ultimaAutenticacaoEm = null;

  async function autenticar() {
    if (autenticacaoEmAndamento) return autenticacaoEmAndamento;
    if (!config.sptransToken) {
      throw new SptransError("SPTRANS_DEFAULT_TOKEN não configurado.", 503);
    }
    autenticacaoEmAndamento = (async () => {
      const url = new URL(`${config.sptransBaseUrl}/Login/Autenticar`);
      url.searchParams.set("token", config.sptransToken);
      const resposta = await fetch(url, {
        method: "POST",
        signal: AbortSignal.timeout(config.sptransTimeoutMs),
      });
      if (!resposta.ok) throw new SptransError(`Falha ao autenticar na SPTrans: ${resposta.status}`, resposta.status);
      const autenticado = (await resposta.text()).trim().toLowerCase() === "true";
      if (!autenticado) throw new SptransError("Token SPTrans recusado.", 401);
      const cookies = typeof resposta.headers.getSetCookie === "function"
        ? resposta.headers.getSetCookie()
        : [resposta.headers.get(COOKIE_HEADER) || ""];
      cookie = cookies.map((item) => item.split(";")[0]).filter(Boolean).join("; ");
      if (!cookie) throw new SptransError("A SPTrans autenticou, mas não retornou cookie de sessão.", 502);
      autenticacoes += 1;
      ultimaAutenticacaoEm = new Date().toISOString();
    })();
    try {
      await autenticacaoEmAndamento;
    } finally {
      autenticacaoEmAndamento = null;
    }
  }

  async function buscarPrevisao(codigoParada, tentouNovamente = false) {
    if (!cookie) await autenticar();
    const resposta = await fetch(`${config.sptransBaseUrl}/Previsao/Parada?codigoParada=${encodeURIComponent(codigoParada)}`, {
      headers: cookie ? { Cookie: cookie } : {},
      signal: AbortSignal.timeout(config.sptransTimeoutMs),
    });
    if (resposta.status === 401 && !tentouNovamente) {
      cookie = "";
      renovacoes += 1;
      await autenticar();
      return buscarPrevisao(codigoParada, true);
    }
    if (!resposta.ok) throw new SptransError(`Falha ao consultar parada ${codigoParada}: ${resposta.status}`, resposta.status);
    return resposta.json();
  }

  return {
    autenticar,
    buscarPrevisao,
    diagnostico: () => ({
      sessaoAtiva: Boolean(cookie),
      autenticacoes,
      renovacoes,
      autenticacaoEmAndamento: Boolean(autenticacaoEmAndamento),
      ultimaAutenticacaoEm,
    }),
  };
}
