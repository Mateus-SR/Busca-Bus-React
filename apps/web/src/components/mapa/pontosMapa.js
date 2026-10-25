// Regras de cor/número dos pontos, compartilhadas entre o mapa (BusMap) e a legenda (LegendaPontos).
// A cor de um ponto é a posição dele na lista `pontos` dentro da paleta, então o ônibus, a parada e a legenda sempre concordam.
export const CORES_PONTOS = ["#dc2626", "#2563eb", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];

export function corDoPonto(indice) {
  return CORES_PONTOS[Math.max(0, indice) % CORES_PONTOS.length];
}

// Descobre a qual ponto o ônibus pertence. Sem `codigoParada` conhecido, mantém a primeira cor (sem número, para não afirmar um ponto errado).
export function infoPontoDoOnibus(onibus, pontos = []) {
  const indice = pontos.findIndex((ponto) => String(ponto.codigo) === String(onibus.codigoParada));
  return { cor: corDoPonto(indice), numero: indice >= 0 ? indice + 1 : null };
}

// Os textos vêm da API e entram em `html` de L.divIcon / bindTooltip, então precisam ser escapados.
export function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
