// Configuração compartilhada pelos mapas do site (BusMap e PontosMapa).
export const LIMITES_SAO_PAULO = [
  [-25.35, -53.35],
  [-19.75, -44.0],
];
export const CENTRO_INICIAL = [-23.556, -46.475];
export const URL_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const ATRIBUICAO_TILES = "&copy; OpenStreetMap contributors";

// Os mapas desenham em canvas, que não entende classes do Tailwind: lemos o valor atual do token (que o alto contraste redefine).
export function lerCor(variavel, reserva) {
  if (typeof document === "undefined") return reserva;
  return getComputedStyle(document.documentElement).getPropertyValue(variavel).trim() || reserva;
}
