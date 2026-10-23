export function formatarDuracao(desde, agora = new Date()) {
  const inicio = new Date(desde);
  let segundos = Math.max(0, Math.floor((agora - inicio) / 1000));
  const dias = Math.floor(segundos / 86400);
  segundos %= 86400;
  const horas = Math.floor(segundos / 3600);
  segundos %= 3600;
  const minutos = Math.floor(segundos / 60);
  return `${dias} dias, ${horas} horas, ${minutos} minutos`;
}
