"use client";

import { useEffect, useRef, useState } from "react";
import "./leaflet.css";
import { criarSvgOnibus } from "@/components/mapa/iconeOnibus";
import { ATRIBUICAO_TILES, CENTRO_INICIAL, LIMITES_SAO_PAULO, URL_TILES } from "@/components/mapa/configMapa";
import {
  CLASSE_BALAO,
  CLASSE_MARCADOR,
  CLASSE_PINO_PARADA,
  CLASSE_PONTO,
  CLASSE_TOOLTIP_PARADA,
  CLASSE_TOOLTIP_PONTO,
  corDoPonto,
  escaparHtml,
  infoPontoDoOnibus,
} from "@/components/mapa/pontosMapa";

function obterPosicao(item) {
  if (!item) return [null, null];
  if (item.posicao) return [item.posicao.lat, item.posicao.lng];
  return [item.latitude ?? item.lat ?? null, item.longitude ?? item.lng ?? null];
}

function tamanhoIcone(zoom) {
  return Math.max(24, Math.min(38, 26 + (zoom - 15) * 2));
}

function chaveIcone(onibus, info, zoom) {
  return `${onibus.codigoLetreiro ?? onibus.codigo ?? ""}|${info.cor}|${info.numero ?? ""}|${tamanhoIcone(zoom)}`;
}

function criarIcone(L, onibus, info, zoom = 16) {
  const codigo = escaparHtml(onibus.codigoLetreiro ?? onibus.codigo ?? "Ônibus");
  const tamanho = tamanhoIcone(zoom);
  const numero = info.numero ? `<span class="${CLASSE_PONTO}" data-ponto style="background:${info.cor}">${info.numero}</span>` : "";
  return L.divIcon({
    className: CLASSE_MARCADOR,
    html: `<span class="${CLASSE_BALAO}">${numero}<span>${codigo}</span></span>${criarSvgOnibus(info.cor, tamanho)}`,
    iconSize: [Math.max(80, tamanho), tamanho],
    iconAnchor: [Math.max(80, tamanho) / 2, tamanho],
    tooltipAnchor: [tamanho / 2 + 4, -tamanho / 2],
  });
}

function conteudoTooltip(onibus) {
  const codigo = escaparHtml(onibus.codigoLetreiro ?? onibus.codigo ?? "Ônibus");
  const sentido = onibus.sentidoLinha ?? onibus.sentido;
  return sentido ? `<strong>${codigo}</strong><br />Sentido: ${escaparHtml(sentido)}` : `<strong>${codigo}</strong>`;
}

function criarIconeParada(L, cor) {
  return L.divIcon({
    className: CLASSE_MARCADOR,
    html: `<span class="${CLASSE_PINO_PARADA}" style="background:${cor};border-color:${cor}" aria-hidden="true"></span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
  });
}

// Rótulo permanente do pino: número do ponto e nome (ou o código, se o ponto não tem nome).
function conteudoTooltipParada(item, cor, indice, codigoExibicao) {
  return `<span class="${CLASSE_TOOLTIP_PARADA}"><span class="${CLASSE_PONTO}" style="background:${cor}" aria-hidden="true">Ponto ${indice + 1}</span>${escaparHtml(item.nome || item.codigo || codigoExibicao)}</span>`;
}

// Balão que abre ao clicar/tocar no pino: nome, endereço e código do ponto. Abre acima do rótulo permanente (offset extra) para não cobri-lo.
function conteudoPopupParada(item) {
  const nome = item.nome ? `<strong>${escaparHtml(item.nome)}</strong>` : "<strong>Ponto sem nome</strong>";
  const endereco = item.endereco ? `<br />${escaparHtml(item.endereco)}` : "";
  return `${nome}${endereco}<br /><small>Código ${escaparHtml(item.codigo)}</small>`;
}

function atualizarOpacidadePontos(mapa, marcadores) {
  const zoom = mapa.getZoom();
  const opacidade = zoom >= 15 ? 1 : zoom >= 14 ? 0.75 : zoom >= 13 ? 0.5 : 0.25;
  marcadores.forEach((marcador) => {
    const elemento = marcador.getTooltip()?.getElement();
    if (elemento) elemento.style.opacity = String(opacidade);
  });
}

export default function BusMap({ codigo, onibus = [], pontos = [], ponto = null }) {
  const containerRef = useRef(null);
  const mapaRef = useRef(null);
  const marcadoresRef = useRef(new Map());
  const chavesIconeRef = useRef(new Map());
  const pontosRef = useRef(new Map());
  const centralizouPontosRef = useRef(false);
  const [mapaPronto, setMapaPronto] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const marcadores = marcadoresRef.current;
    const chavesIcone = chavesIconeRef.current;
    const pontosMap = pontosRef.current;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !containerRef.current) return;
      const mapa = L.map(containerRef.current, {
        maxBounds: LIMITES_SAO_PAULO,
        maxBoundsViscosity: 1,
        minZoom: 7,
      }).setView(CENTRO_INICIAL, 13);
      L.tileLayer(URL_TILES, { attribution: ATRIBUICAO_TILES }).addTo(mapa);
      mapaRef.current = mapa;
      mapa.on("zoomend", () => atualizarOpacidadePontos(mapa, pontosRef.current));
      setTimeout(() => mapa.invalidateSize(), 100);
      setMapaPronto(true);
    });

    return () => {
      cancelado = true;
      marcadores.forEach((marcador) => marcador.remove());
      marcadores.clear();
      chavesIcone.clear();
      pontosMap.forEach((marcador) => marcador.remove());
      pontosMap.clear();
      mapaRef.current?.remove();
      mapaRef.current = null;
      centralizouPontosRef.current = false;
      setMapaPronto(false);
    };
  }, []);

  // Renderização dos ônibus (independente de haver pontos ou não)
  useEffect(() => {
    if (!mapaRef.current || !mapaPronto) return;
    import("leaflet").then(({ default: L }) => {
      if (!mapaRef.current) return;
      const atuais = new Set();
      onibus.forEach((onibusAtual) => {
        const posicao = obterPosicao(onibusAtual);
        if (posicao.some((valor) => typeof valor !== "number")) return;
        const id = String(onibusAtual.id);
        atuais.add(id);
        const info = infoPontoDoOnibus(onibusAtual, pontos);
        const marcadorExistente = marcadoresRef.current.get(id);
        const zoomAtual = mapaRef.current.getZoom();
        const chave = chaveIcone(onibusAtual, info, zoomAtual);
        if (marcadorExistente) {
          marcadorExistente.setLatLng(posicao).setTooltipContent(conteudoTooltip(onibusAtual));
          if (chavesIconeRef.current.get(id) !== chave) {
            marcadorExistente.setIcon(criarIcone(L, onibusAtual, info, zoomAtual));
            chavesIconeRef.current.set(id, chave);
          }
          return;
        }
        chavesIconeRef.current.set(id, chave);
        const marcador = L.marker(posicao, { icon: criarIcone(L, onibusAtual, info, zoomAtual) })
          .addTo(mapaRef.current)
          .bindTooltip(conteudoTooltip(onibusAtual), { direction: "right", className: "bus-tooltip" });
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
    if (!mapaRef.current || !mapaPronto) return undefined;
    let cancelado = false;
    let aoAmpliar;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !mapaRef.current) return;
      aoAmpliar = () => {
        marcadoresRef.current.forEach((marcador, id) => {
          const item = onibus.find((atual) => String(atual.id) === id);
          if (!item) return;
          const info = infoPontoDoOnibus(item, pontos);
          const zoomAtual = mapaRef.current.getZoom();
          const chave = chaveIcone(item, info, zoomAtual);
          if (chavesIconeRef.current.get(id) === chave) return;
          marcador.setIcon(criarIcone(L, item, info, zoomAtual));
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

  // Renderização dos pontos/paradas (sempre exibidos, mesmo quando `onibus` está vazio)
  useEffect(() => {
    if (!mapaRef.current || !mapaPronto) return;
    import("leaflet").then(({ default: L }) => {
      if (!mapaRef.current) return;
      const lista = pontos.length ? pontos : (ponto ? [ponto] : []);
      const codigosAtuais = new Set(lista.map((item) => String(item.codigo)));

      // Remove paradas que saíram da lista
      pontosRef.current.forEach((marcador, cod) => {
        if (!codigosAtuais.has(cod)) {
          marcador.remove();
          pontosRef.current.delete(cod);
        }
      });

      lista.forEach((item, indice) => {
        const cod = String(item.codigo);
        const [lat, lng] = obterPosicao(item);
        if (typeof lat !== "number" || typeof lng !== "number") return;

        const cor = corDoPonto(indice);
        const existente = pontosRef.current.get(cod);
        if (existente) {
          // Nome, endereço e posição podem chegar depois do pino (o cadastro vem de outra requisição).
          // Só mexe no que mudou: o radar chega a cada ciclo e não deve reescrever o DOM à toa.
          const posicaoAtual = existente.getLatLng();
          if (posicaoAtual.lat !== lat || posicaoAtual.lng !== lng) existente.setLatLng([lat, lng]);
          const tooltip = conteudoTooltipParada(item, cor, indice, codigo);
          if (existente.getTooltip().getContent() !== tooltip) existente.setTooltipContent(tooltip);
          const popup = conteudoPopupParada(item);
          if (existente.getPopup().getContent() !== popup) existente.setPopupContent(popup);
        } else {
          const marcador = L.marker([lat, lng], { icon: criarIconeParada(L, cor), zIndexOffset: 1000 })
            .addTo(mapaRef.current)
            .bindTooltip(conteudoTooltipParada(item, cor, indice, codigo), {
              permanent: true,
              direction: "top",
              offset: [0, -34],
              className: CLASSE_TOOLTIP_PONTO,
            })
            .bindPopup(conteudoPopupParada(item), { offset: [0, -34 - 36] });
          pontosRef.current.set(cod, marcador);
        }

        if (indice === 0 && !centralizouPontosRef.current) {
          centralizouPontosRef.current = true;
          mapaRef.current.setView([lat, lng], 16);
        }
      });

      atualizarOpacidadePontos(mapaRef.current, pontosRef.current.values());
    });
  }, [codigo, ponto, pontos, mapaPronto]);

  return <div ref={containerRef} data-codigo={codigo} className="h-full min-h-[280px] w-full" />;
}