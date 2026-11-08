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

// Classes do Tailwind dos marcadores. O Leaflet recebe HTML em string, então ficam aqui, escritas por inteiro
// (o Tailwind só gera as classes que encontra no código). Cores vêm dos tokens, que o alto contraste redefine.

// Wrapper do L.divIcon: no lugar da classe padrão do Leaflet (fundo branco e borda), nada de caixa.
export const CLASSE_MARCADOR = "border-0 bg-transparent";

// Bolinha com o número/rótulo do ponto; a cor de fundo vem do ponto (style inline).
export const CLASSE_PONTO =
  "flex min-h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 font-roboto-mono text-[16px] leading-none font-bold whitespace-nowrap text-white contraste:border contraste:border-balao-borda";

// Balão do ônibus: branco com borda vermelha fixa (a cor do ponto fica só no ícone e na bolinha numerada).
// `has-[[data-ponto]]` tira o respiro da esquerda quando há bolinha; `after:` é a ponta apontando para o ônibus.
export const CLASSE_BALAO =
  "absolute bottom-[calc(100%+5px)] left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border-2 border-balao-borda bg-balao-fundo px-[7px] py-0.5 font-roboto-mono text-[13px] leading-[normal] font-bold whitespace-nowrap text-balao-texto shadow-[0_2px_6px_rgb(0_0_0/25%)] contraste:shadow-none has-[[data-ponto]]:pl-0.5 after:absolute after:bottom-[-5px] after:left-1/2 after:size-[7px] after:-translate-x-1/2 after:rotate-45 after:border-r-2 after:border-b-2 after:border-inherit after:bg-inherit";

// Pino da parada (as cores de fundo e borda vêm do ponto, por style inline).
export const CLASSE_PINO_PARADA =
  "block size-[26px] -rotate-45 rounded-[50%_50%_50%_0] border-[3px] border-solid shadow-[0_2px_6px_rgb(0_0_0/30%)]";

// Conteúdo do tooltip permanente da parada.
export const CLASSE_TOOLTIP_PARADA =
  "inline-flex min-w-[150px] max-w-[200px] flex-col items-center gap-0.5 text-center whitespace-normal";

// Os textos vêm da API e entram em `html` de L.divIcon / bindTooltip, então precisam ser escapados.
export function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
