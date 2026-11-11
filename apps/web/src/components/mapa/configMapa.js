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

// O mapa (tiles do OpenStreetMap) fica claro mesmo no alto contraste, mas os tokens de superfície e de info viram preto e azul-claro:
// no alto contraste usamos cores fixas escuras, com contorno branco, para o desenho continuar visível sobre o mapa.
export function coresDoMapa() {
  const altoContraste = typeof document !== "undefined" && Boolean(document.documentElement.dataset.contraste);
  if (altoContraste) {
    return { destaque: "#1e3a8a", ponto: "#000", pontoSelecionado: "#000", contorno: "#fff", contornoSelecionado: "#fbbf24" };
  }
  return {
    destaque: lerCor("--color-info", "#2563eb"),
    ponto: lerCor("--color-marca", "#dc2626"),
    pontoSelecionado: lerCor("--color-marca-forte", "#991b1b"),
    contorno: lerCor("--color-superficie", "#fff"),
    contornoSelecionado: lerCor("--color-texto", "#000"),
  };
}
