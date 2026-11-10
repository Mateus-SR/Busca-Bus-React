"use client";

import { useEffect, useRef, useState } from "react";
import "@/components/mapa/leaflet.css";
import { ATRIBUICAO_TILES, CENTRO_INICIAL, LIMITES_SAO_PAULO, URL_TILES, lerCor } from "@/components/mapa/configMapa";
import { escaparHtml } from "@/components/mapa/pontosMapa";

// Mapa da busca de pontos: círculo do raio e da precisão em volta de quem busca, e um marcador leve (canvas) por ponto.
// A lista ao lado é a alternativa acessível do mapa; aqui o foco é mostrar onde fica cada ponto.
export default function PontosMapa({ centro, precisao, raio, pontos, selecionado, onSelecionar, escolhendo, onEscolherLocal }) {
  const containerRef = useRef(null);
  const mapaRef = useRef(null);
  const camadaCentroRef = useRef(null);
  const camadaPontosRef = useRef(null);
  const pontosPorCodigoRef = useRef(new Map());
  const acoesRef = useRef({ escolhendo, onEscolherLocal, onSelecionar });
  const [mapaPronto, setMapaPronto] = useState(false);

  useEffect(() => {
    acoesRef.current = { escolhendo, onEscolherLocal, onSelecionar };
  }, [escolhendo, onEscolherLocal, onSelecionar]);

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
      mapaRef.current = mapa;
      setMapaPronto(true);
    });
    const pontosPorCodigo = pontosPorCodigoRef.current;
    return () => {
      cancelado = true;
      pontosPorCodigo.clear();
      mapaRef.current?.remove();
      mapaRef.current = null;
      setMapaPronto(false);
    };
  }, []);

  // Posição, precisão e raio: redesenha os círculos e enquadra o raio na tela.
  useEffect(() => {
    if (!mapaPronto || !centro) return;
    let cancelado = false;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !mapaRef.current) return;
      const cor = lerCor("--color-info", "#2563eb");
      const contorno = lerCor("--color-superficie", "#fff");
      const camada = camadaCentroRef.current;
      camada.clearLayers();
      const posicao = [centro.lat, centro.lng];
      if (precisao) L.circle(posicao, { radius: precisao, color: cor, weight: 1, fillColor: cor, fillOpacity: 0.12, interactive: false }).addTo(camada);
      const circuloRaio = L.circle(posicao, { radius: raio, color: cor, weight: 2, dashArray: "6 6", fillColor: cor, fillOpacity: 0.05, interactive: false }).addTo(camada);
      L.circleMarker(posicao, { radius: 8, color: contorno, weight: 3, fillColor: cor, fillOpacity: 1, interactive: false }).addTo(camada);
      mapaRef.current.fitBounds(circuloRaio.getBounds(), { padding: [24, 24], maxZoom: 18 });
    });
    return () => {
      cancelado = true;
    };
  }, [mapaPronto, centro, precisao, raio]);

  // Pontos: poucas dezenas por consulta, então refazer a camada inteira é mais simples que comparar um a um.
  useEffect(() => {
    if (!mapaPronto) return;
    let cancelado = false;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !mapaRef.current) return;
      const camada = camadaPontosRef.current;
      camada.clearLayers();
      pontosPorCodigoRef.current.clear();
      const cor = lerCor("--color-marca", "#dc2626");
      const corSelecionado = lerCor("--color-marca-forte", "#991b1b");
      const contorno = lerCor("--color-superficie", "#fff");
      const contornoSelecionado = lerCor("--color-texto", "#000");
      pontos.forEach((ponto) => {
        const ativo = ponto.codigo === selecionado;
        const marcador = L.circleMarker([ponto.lat, ponto.lng], {
          radius: ativo ? 11 : 7,
          color: ativo ? contornoSelecionado : contorno,
          weight: ativo ? 3 : 2,
          fillColor: ativo ? corSelecionado : cor,
          fillOpacity: 1,
          // Sem isso o toque no ponto também dispararia o clique do mapa (escolher local).
          bubblingMouseEvents: false,
        })
          .bindTooltip(`<strong>${escaparHtml(ponto.codigo)}</strong><br />${escaparHtml(ponto.nome)}`, { className: "bus-tooltip" })
          .on("click", () => acoesRef.current.onSelecionar(ponto.codigo))
          .addTo(camada);
        if (ativo) marcador.bringToFront();
        pontosPorCodigoRef.current.set(ponto.codigo, ponto);
      });
    });
    return () => {
      cancelado = true;
    };
  }, [mapaPronto, pontos, selecionado]);

  useEffect(() => {
    const ponto = selecionado && pontosPorCodigoRef.current.get(selecionado);
    if (mapaRef.current && ponto) mapaRef.current.panTo([ponto.lat, ponto.lng]);
  }, [selecionado, pontos]);

  return <div ref={containerRef} role="region" aria-label="Mapa dos pontos de ônibus" className="h-full min-h-[320px] w-full" />;
}
