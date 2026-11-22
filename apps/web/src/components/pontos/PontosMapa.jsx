"use client";

import { useEffect, useRef, useState } from "react";
import "@/components/mapa/leaflet.css";
import { ATRIBUICAO_TILES, CENTRO_INICIAL, LIMITES_SAO_PAULO, URL_TILES, coresDoMapa } from "@/components/mapa/configMapa";
import { escaparHtml } from "@/components/mapa/pontosMapa";

function coordsPonto(ponto) {
  if (!ponto) return null;
  const lat = ponto.lat ?? ponto.latitude ?? ponto.posicao?.lat;
  const lng = ponto.lng ?? ponto.longitude ?? ponto.posicao?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return [lat, lng];
}

// `margemSuperior`/`margemInferior` (px) = faixas do mapa cobertas por controles e pelo painel inferior no celular (0 no desktop).
// Centralizar e enquadrar levam isso em conta para o ponto não ficar escondido atrás do painel.
// Opções de enquadramento do Leaflet com a margem de cada lado somada à folga `base`.
function opcoesDeEnquadramento(margens, base, extra = {}) {
  return { paddingTopLeft: [base, base + margens.superior], paddingBottomRight: [base, base + margens.inferior], ...extra };
}

// Leva o ponto ao meio da parte visível do mapa (a que sobra entre os controles e o painel), sem mudar o zoom se `zoom` for omitido.
function centralizarNoVisivel(mapa, coords, margens, zoom) {
  const alvoZoom = zoom ?? mapa.getZoom();
  const deslocamento = (margens.inferior - margens.superior) / 2;
  const centro = deslocamento ? mapa.unproject(mapa.project(coords, alvoZoom).add([0, deslocamento]), alvoZoom) : coords;
  if (zoom === undefined) mapa.panTo(centro);
  else mapa.setView(centro, zoom);
}

export default function PontosMapa({ centro, precisao, raio, pontos = [], selecionado, onSelecionar, escolhendo, onEscolherLocal, foco, onVisaoMudou, marcados, margemSuperior = 0, margemInferior = 0 }) {
  const containerRef = useRef(null);
  const mapaRef = useRef(null);
  const camadaCentroRef = useRef(null);
  const camadaPontosRef = useRef(null);
  const pontosPorCodigoRef = useRef(new Map());
  const marcadoresPorCodigoRef = useRef(new Map());
  const centroAnteriorRef = useRef(null);
  const acoesRef = useRef({ escolhendo, onEscolherLocal, onSelecionar, onVisaoMudou });
  const margensRef = useRef({ superior: margemSuperior, inferior: margemInferior });
  const [mapaPronto, setMapaPronto] = useState(false);

  useEffect(() => {
    acoesRef.current = { escolhendo, onEscolherLocal, onSelecionar, onVisaoMudou };
  }, [escolhendo, onEscolherLocal, onSelecionar, onVisaoMudou]);

  useEffect(() => {
    margensRef.current = { superior: margemSuperior, inferior: margemInferior };
  }, [margemSuperior, margemInferior]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.style.cursor = escolhendo ? "crosshair" : "";
  }, [escolhendo, mapaPronto]);

  useEffect(() => {
    let cancelado = false;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !containerRef.current) return;
      const mapa = L.map(containerRef.current, {
        maxBounds: LIMITES_SAO_PAULO,
        maxBoundsViscosity: 1,
        minZoom: 7,
        preferCanvas: true,
      }).setView(CENTRO_INICIAL, 13);
      L.tileLayer(URL_TILES, { attribution: ATRIBUICAO_TILES }).addTo(mapa);
      camadaCentroRef.current = L.layerGroup().addTo(mapa);
      camadaPontosRef.current = L.layerGroup().addTo(mapa);
      mapa.on("click", (evento) => {
        const { escolhendo: ativo, onEscolherLocal: escolher } = acoesRef.current;
        if (ativo) escolher({ lat: evento.latlng.lat, lng: evento.latlng.lng });
      });
      const informarVisao = () => {
        const limites = mapa.getBounds();
        acoesRef.current.onVisaoMudou?.({ norte: limites.getNorth(), sul: limites.getSouth(), leste: limites.getEast(), oeste: limites.getWest(), zoom: mapa.getZoom() });
      };
      mapa.on("moveend", informarVisao);
      mapaRef.current = mapa;
      setTimeout(() => mapa.invalidateSize(), 100);
      informarVisao();
      setMapaPronto(true);
    });
    const pontosPorCodigo = pontosPorCodigoRef.current;
    const marcadoresPorCodigo = marcadoresPorCodigoRef.current;
    return () => {
      cancelado = true;
      pontosPorCodigo.clear();
      marcadoresPorCodigo.clear();
      mapaRef.current?.remove();
      mapaRef.current = null;
      setMapaPronto(false);
    };
  }, []);

  useEffect(() => {
    if (!mapaPronto || !centro) return;
    let cancelado = false;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !mapaRef.current) return;
      const { destaque: cor, contorno } = coresDoMapa();
      const camada = camadaCentroRef.current;
      camada.clearLayers();
      const posicao = [centro.lat, centro.lng];
      if (precisao) L.circle(posicao, { radius: precisao, color: cor, weight: 1, fillColor: cor, fillOpacity: 0.12, interactive: false }).addTo(camada);
      L.circleMarker(posicao, { radius: 8, color: contorno, weight: 3, fillColor: cor, fillOpacity: 1, interactive: false }).addTo(camada);
      if (raio) {
        const circuloRaio = L.circle(posicao, { radius: raio, color: cor, weight: 2, dashArray: "6 6", fillColor: cor, fillOpacity: 0.05, interactive: false }).addTo(camada);
        mapaRef.current.fitBounds(circuloRaio.getBounds(), opcoesDeEnquadramento(margensRef.current, 24, { maxZoom: 18 }));
      } else if (centroAnteriorRef.current !== centro) {
        centralizarNoVisivel(mapaRef.current, posicao, margensRef.current, Math.max(mapaRef.current.getZoom(), 16));
      }
      centroAnteriorRef.current = centro;
    });
    return () => {
      cancelado = true;
    };
  }, [mapaPronto, centro, precisao, raio]);

  useEffect(() => {
    if (!mapaPronto) return;
    let cancelado = false;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !mapaRef.current) return;
      const camada = camadaPontosRef.current;
      camada.clearLayers();
      pontosPorCodigoRef.current.clear();
      marcadoresPorCodigoRef.current.clear();
      const { ponto: cor, pontoSelecionado: corSelecionado, contorno, contornoSelecionado } = coresDoMapa();
      pontos.forEach((ponto) => {
        const coords = coordsPonto(ponto);
        if (!coords) return;
        const ativo = String(ponto.codigo) === String(selecionado);
        // Pontos escolhidos para a exibição ficam com a cor de destaque e um pouco maiores, mesmo sem estarem selecionados.
        const escolhido = ativo || Boolean(marcados?.has(String(ponto.codigo)));
        const marcador = L.circleMarker(coords, {
          radius: ativo ? 11 : escolhido ? 9 : 7,
          color: escolhido ? contornoSelecionado : contorno,
          weight: escolhido ? 3 : 2,
          fillColor: escolhido ? corSelecionado : cor,
          fillOpacity: 1,
          bubblingMouseEvents: false,
        })
          .bindTooltip(`<strong>${escaparHtml(ponto.codigo)}</strong><br />${escaparHtml(ponto.nome)}`, { className: "bus-tooltip" })
          .on("click", () => acoesRef.current.onSelecionar(ponto.codigo))
          .addTo(camada);
        if (ativo) {
          marcador.bringToFront();
          marcador.openTooltip();
        }
        pontosPorCodigoRef.current.set(String(ponto.codigo), { ...ponto, lat: coords[0], lng: coords[1] });
        marcadoresPorCodigoRef.current.set(String(ponto.codigo), marcador);
      });
    });
    return () => {
      cancelado = true;
    };
  }, [mapaPronto, pontos, selecionado, marcados]);

  useEffect(() => {
    const ponto = selecionado && pontosPorCodigoRef.current.get(String(selecionado));
    if (mapaRef.current && ponto) {
      centralizarNoVisivel(mapaRef.current, [ponto.lat, ponto.lng], margensRef.current);
      marcadoresPorCodigoRef.current.get(String(selecionado))?.openTooltip();
    }
  }, [selecionado]);

  useEffect(() => {
    if (mapaPronto && foco) {
      mapaRef.current.invalidateSize();
      // `limites` ([[sul, oeste], [norte, leste]]) enquadra vários pontos de uma vez.
      if (foco.limites) mapaRef.current.fitBounds(foco.limites, opcoesDeEnquadramento(margensRef.current, 40, { maxZoom: 17 }));
      else centralizarNoVisivel(mapaRef.current, [foco.lat, foco.lng], margensRef.current, foco.zoom ?? 17);
    }
  }, [mapaPronto, foco]);

  // No celular o zoom (canto superior esquerdo) desce para baixo dos controles flutuantes e a atribuição (canto inferior direito)
  // sobe para fora do painel; no desktop as duas variáveis valem 0 e nada muda.
  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Mapa dos pontos de ônibus"
      style={{ "--mapa-margem-superior": `${margemSuperior}px`, "--mapa-margem-inferior": `${margemInferior}px` }}
      className="h-full min-h-[240px] w-full [&_.leaflet-bottom]:mb-[var(--mapa-margem-inferior)] [&_.leaflet-top]:mt-[var(--mapa-margem-superior)]"
    />
  );
}