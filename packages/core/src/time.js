export function converteHoraMinuto(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

// A SPTrans informa as previsões em horário de São Paulo. Usar o fuso do aparelho/servidor (UTC no Render) quebra a conta.
const FUSO_SPTRANS = "America/Sao_Paulo";
const formatadorSaoPaulo = new Intl.DateTimeFormat("en-GB", { timeZone: FUSO_SPTRANS, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function minutosDoDiaEmSaoPaulo(data = new Date()) {
  const partes = formatadorSaoPaulo.formatToParts(data);
  const valor = (tipo) => Number(partes.find((parte) => parte.type === tipo).value);
  return valor("hour") * 60 + valor("minute");
}

export function minutosAteChegar(previsao, agoraMin = minutosDoDiaEmSaoPaulo()) {
  return (converteHoraMinuto(previsao) - agoraMin + 1440) % 1440;
}
