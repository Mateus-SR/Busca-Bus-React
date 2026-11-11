const RAIO_TERRA_METROS = 6371008.8;
const METROS_POR_GRAU_LATITUDE = 111320;

// Caixa que cobre a cidade de São Paulo com folga para pontos nas divisas. Serve para recusar coordenadas absurdas (GPS errado, lat/lng invertidos).
export const AREA_SAO_PAULO = Object.freeze({ sul: -24.2, norte: -23.2, oeste: -47.0, leste: -46.1 });

const paraRadianos = (graus) => (graus * Math.PI) / 180;

export function coordenadaValida(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function dentroDeSaoPaulo(lat, lng) {
  return coordenadaValida(lat, lng)
    && lat >= AREA_SAO_PAULO.sul && lat <= AREA_SAO_PAULO.norte
    && lng >= AREA_SAO_PAULO.oeste && lng <= AREA_SAO_PAULO.leste;
}

// Distância em metros pela fórmula de Haversine; o erro frente ao elipsoide é pequeno para distâncias urbanas.
export function distanciaMetros(origem, destino) {
  const dLat = paraRadianos(destino.lat - origem.lat);
  const dLng = paraRadianos(destino.lng - origem.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(paraRadianos(origem.lat)) * Math.cos(paraRadianos(destino.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_METROS * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Retângulo que contém o círculo de raio informado; útil para pré-filtrar por área antes de calcular distâncias.
export function limitesDoRaio(centro, raioMetros) {
  const deltaLat = raioMetros / METROS_POR_GRAU_LATITUDE;
  const deltaLng = raioMetros / (METROS_POR_GRAU_LATITUDE * Math.max(Math.cos(paraRadianos(centro.lat)), 0.01));
  return {
    sul: centro.lat - deltaLat,
    norte: centro.lat + deltaLat,
    oeste: centro.lng - deltaLng,
    leste: centro.lng + deltaLng,
  };
}

export function formatarDistancia(metros) {
  if (!Number.isFinite(metros)) return "";
  if (metros < 10) return "menos de 10 m";
  if (metros < 995) return `${Math.round(metros / 10) * 10} m`;
  return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}
