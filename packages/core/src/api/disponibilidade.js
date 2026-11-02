const STATUS_TRANSITORIOS = new Set([502, 503, 504]);

export function ehStatusTransitorioApi(status) {
  return STATUS_TRANSITORIOS.has(status);
}

export function ehFalhaTransitoriaApi(error) {
  return Boolean(
    error?.codigo === "REDE" ||
    ehStatusTransitorioApi(error?.status),
  );
}

function esperar(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Operação cancelada.", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException("Operação cancelada.", "AbortError"));
    }, { once: true });
  });
}

async function consultarHealth(url, sinal, timeoutMs) {
  const controlador = new AbortController();
  const cancelar = () => controlador.abort(sinal?.reason);
  sinal?.addEventListener("abort", cancelar, { once: true });
  const timer = setTimeout(() => controlador.abort(new Error("Tempo limite do health check excedido.")), timeoutMs);
  try {
    return await fetch(`${url}/v1/health`, { signal: controlador.signal });
  } finally {
    clearTimeout(timer);
    sinal?.removeEventListener("abort", cancelar);
  }
}

export async function aguardarDisponibilidadeApi(baseUrl, {
  sinal,
  limiteMs = 60_000,
  intervaloInicialMs = 5_000,
  aoTentar,
} = {}) {
  const url = baseUrl?.replace(/\/$/, "");
  const inicio = Date.now();
  let intervalo = intervaloInicialMs;

  while (Date.now() - inicio < limiteMs) {
    aoTentar?.();
    try {
      const resposta = await consultarHealth(url, sinal, Math.min(10_000, limiteMs));
      if (resposta.ok) return await resposta.json();
    } catch (error) {
      if (error?.name === "AbortError") throw error;
    }
    const restante = limiteMs - (Date.now() - inicio);
    if (restante <= 0) break;
    await esperar(Math.min(intervalo, restante), sinal);
    intervalo = Math.min(intervalo * 2, 10_000);
  }

  throw new Error("O serviço não ficou disponível dentro do tempo esperado.");
}
