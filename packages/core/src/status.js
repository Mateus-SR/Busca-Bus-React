import { converteHoraMinuto } from "./time.js";

export function calcularStatus(previsaoAtual, promessa, config = {}) {
  const atraso = Number(config.tempoAtraso ?? config.atraso ?? 5);
  const adiantado = Number(config.tempoAdiantado ?? config.adiantado ?? 2);
  const diff = typeof previsaoAtual === "number"
    ? previsaoAtual
    : converteHoraMinuto(previsaoAtual) - converteHoraMinuto(promessa);
  if (diff >= atraso) return "Atrasado";
  if (diff <= -adiantado) return "Adiantado";
  return "Normal";
}
