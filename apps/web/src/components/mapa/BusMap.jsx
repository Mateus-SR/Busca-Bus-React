"use client";

import { useEffect, useRef, useState } from "react";
import { criarSvgOnibus } from "@/components/mapa/iconeOnibus";

function obterPosicao(onibus) {
  if (onibus.posicao) return [onibus.posicao.lat, onibus.posicao.lng];
  return [onibus.latitude, onibus.longitude];
}

const CORES_PONTOS = ["#dc2626", "#2563eb", "#16a34a", "#9333ea", "#ea580c", "#0891b2"];

function tamanhoIcone(zoom) {
  return Math.max(24, Math.min(38, 26 + (zoom - 15) * 2));
}

// Só o que muda o desenho do ícone entra na chave; sem ela, o ícone era recriado a cada atualização e a cada zoom.
function chaveIcone(onibus, cor, zoom) {
  return `${onibus.codigoLetreiro ?? onibus.codigo ?? ""}|${cor}|${tamanhoIcone(zoom)}`;
}

function criarIcone(L, onibus, cor, zoom = 16) {
  const codigo = onibus.codigoLetreiro ?? onibus.codigo ?? "Ônibus";
  const tamanho = tamanhoIcone(zoom);
  return L.divIcon({
    className: "bus-marker-wrap",
    html: `<span class="bus-marker-card" style="border-color:${cor};color:${cor}">${codigo}</span>${criarSvgOnibus(cor, tamanho)}`,
    iconSize: [Math.max(80, tamanho), tamanho + 22],
    iconAnchor: [Math.max(40, tamanho / 2), tamanho],
  });
}

function criarIconeParada(L, cor) {
  return L.divIcon({
    className: "stop-marker-wrap",
    html: `<span class="stop-marker-pin" style="background:${cor};border-color:${cor}" aria-hidden="true"></span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
  });
}

export default function BusMap({ codigo, onibus = [], pontos = [], ponto = null }) {
  const containerRef = useRef(null);
  const mapaRef = useRef(null);
  const marcadoresRef = useRef(new Map());
  const chavesIconeRef = useRef(new Map());
  const marcadorParadaRef = useRef(null);
  const pontosRef = useRef(new Map());
  const [mapaPronto, setMapaPronto] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const marcadores = marcadoresRef.current;
    const chavesIcone = chavesIconeRef.current;
    const pontos = pontosRef.current;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !containerRef.current) return;
      const mapa = L.map(containerRef.current).setView([-23.556, -46.475], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapa);
      mapaRef.current = mapa;
      setMapaPronto(true);
    });

    return () => {
      cancelado = true;
      marcadores.forEach((marcador) => marcador.remove());
      marcadores.clear();
      chavesIcone.clear();
      marcadorParadaRef.current?.remove();
      marcadorParadaRef.current = null;
      pontos.forEach((marcador) => marcador.remove());
      pontos.clear();
      mapaRef.current?.remove();
      mapaRef.current = null;
      setMapaPronto(false);
    };
  }, []);

  useEffect(() => {
    if (!mapaRef.current) return;
    import("leaflet").then(({ default: L }) => {
      const atuais = new Set();
      onibus.forEach((onibusAtual) => {
        const posicao = obterPosicao(onibusAtual);
        if (posicao.some((valor) => typeof valor !== "number")) return;
        const id = String(onibusAtual.id);
        atuais.add(id);
        const indicePonto = Math.max(0, (pontos.findIndex((item) => String(item.codigo) === String(onibusAtual.codigoParada)) || 0));
        const cor = CORES_PONTOS[indicePonto % CORES_PONTOS.length];
        const marcadorExistente = marcadoresRef.current.get(id);
        const zoomAtual = mapaRef.current.getZoom();
        const chave = chaveIcone(onibusAtual, cor, zoomAtual);
        if (marcadorExistente) {
          marcadorExistente.setLatLng(posicao);
          if (chavesIconeRef.current.get(id) !== chave) {
            marcadorExistente.setIcon(criarIcone(L, onibusAtual, cor, zoomAtual));
            chavesIconeRef.current.set(id, chave);
          }
          return;
        }
        chavesIconeRef.current.set(id, chave);
        const marcador = L.marker(posicao, { icon: criarIcone(L, onibusAtual, cor, zoomAtual) })
          .addTo(mapaRef.current)
          .bindTooltip(`<strong>${onibusAtual.codigoLetreiro ?? onibusAtual.codigo}</strong><br />${onibusAtual.sentidoLinha ?? onibusAtual.sentido ?? ""}`, { permanent: true, direction: "top", offset: [0, -16], className: "bus-tooltip" });
        marcadoresRef.current.set(id, marcador);
      });
      marcadoresRef.current.forEach((marcador, id) => {
        if (!atuais.has(id)) {
          marcador.remove();
          marcadoresRef.current.delete(id);
          chavesIconeRef.current.delete(id);
        }
      });
    });
  }, [onibus, pontos, mapaPronto]);

  useEffect(() => {
    if (!mapaRef.current) return undefined;
    let cancelado = false;
    let aoAmpliar;
    import("leaflet").then(({ default: L }) => {
      if (cancelado) return;
      aoAmpliar = () => {
        marcadoresRef.current.forEach((marcador, id) => {
          const item = onibus.find((atual) => String(atual.id) === id);
          if (!item) return;
          const indice = Math.max(0, pontos.findIndex((atual) => String(atual.codigo) === String(item.codigoParada)));
          const cor = CORES_PONTOS[indice % CORES_PONTOS.length];
          const zoomAtual = mapaRef.current.getZoom();
          const chave = chaveIcone(item, cor, zoomAtual);
          if (chavesIconeRef.current.get(id) === chave) return;
          marcador.setIcon(criarIcone(L, item, cor, zoomAtual));
          chavesIconeRef.current.set(id, chave);
        });
      };
      mapaRef.current.on("zoomend", aoAmpliar);
    });
    return () => {
      cancelado = true;
      if (aoAmpliar) mapaRef.current?.off("zoomend", aoAmpliar);
    };
  }, [onibus, pontos, mapaPronto]);

  useEffect(() => {
    if (!mapaRef.current || (!ponto?.posicao && !pontos.length)) return;
    import("leaflet").then(({ default: L }) => {
      const lista = pontos.length ? pontos : [ponto];
      lista.forEach((item, indice) => {
        if (!item?.posicao || pontosRef.current.has(String(item.codigo))) return;
        const { lat, lng } = item.posicao;
        if (![lat, lng].every((valor) => typeof valor === "number")) return;
        const cor = CORES_PONTOS[indice % CORES_PONTOS.length];
        const marcador = L.marker([lat, lng], { icon: criarIconeParada(L, cor), zIndexOffset: 1000 })
          .addTo(mapaRef.current)
          .bindTooltip(`<strong>Ponto ${indice + 1}:</strong> ${item.nome || item.codigo || codigo}`, { permanent: true, direction: "top", offset: [0, -34] });
        pontosRef.current.set(String(item.codigo), marcador);
        if (indice === 0) mapaRef.current.setView([lat, lng], 16);
      });
    });
  }, [codigo, ponto, pontos, mapaPronto]);

  return <div ref={containerRef} data-codigo={codigo} className="h-full min-h-[420px] w-full" />;
}
