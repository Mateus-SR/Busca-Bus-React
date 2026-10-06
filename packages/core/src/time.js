export function converteHoraMinuto(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

export function minutosAteChegar(previsao, agoraMin = new Date().getHours() * 60 + new Date().getMinutes()) {
  return (converteHoraMinuto(previsao) - agoraMin + 1440) % 1440;
}
