// Pontos fictícios, no mesmo formato que o servidor devolve em `pontos`.
export const PONTOS_MAPA_MOCK = [
  { codigo: "650004840", nome: "Metrô Itaquera", posicao: { lat: -23.5405, lng: -46.4776 } },
  { codigo: "650004841", nome: "Fatec Zona Leste", posicao: { lat: -23.5528, lng: -46.4691 } },
  { codigo: "650004842", nome: "Terminal Arthur Alvim", posicao: { lat: -23.5442, lng: -46.4834 } },
];

export const ONIBUS_MAPA_MOCK = [
  { id: "bus-1", codigo: "233C-10", codigoParada: "650004840", latitude: -23.5558, longitude: -46.4731, sentido: "CERET" },
  { id: "bus-2", codigo: "2060-10", codigoParada: "650004841", latitude: -23.5486, longitude: -46.4612, sentido: "Metrô Arthur Alvim" },
  { id: "bus-3", codigo: "273X-10", codigoParada: "650004842", latitude: -23.5631, longitude: -46.4865, sentido: "Jardim das Oliveiras" },
  { id: "bus-4", codigo: "8000-10", codigoParada: "650004840", latitude: -23.5452, longitude: -46.5018, sentido: "Lapa" },
  { id: "bus-5", codigo: "4310-10", codigoParada: "650004841", latitude: -23.5713, longitude: -46.4528, sentido: "E.T. Itaquera" },
];
