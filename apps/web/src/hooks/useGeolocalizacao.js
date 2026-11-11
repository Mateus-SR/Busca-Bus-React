"use client";

import { useCallback, useRef, useState } from "react";

const OPCOES = { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 };

const MENSAGENS = {
  negada: "O acesso à localização foi negado. Libere a localização nas configurações do navegador ou escolha um local no mapa.",
  indisponivel: "Não foi possível obter sua localização agora. Tente de novo ou escolha um local no mapa.",
  tempo: "A localização demorou demais para responder. Tente de novo ou escolha um local no mapa.",
  semSuporte: "Este navegador não oferece localização. Escolha um local no mapa.",
  inseguro: "A localização só funciona em conexão segura (HTTPS). Escolha um local no mapa.",
};

// Pede a localização uma vez por clique (sem acompanhar o movimento, para poupar bateria) e guarda só em memória.
// `posicao` = { lat, lng, precisao (metros, ou null se o usuário escolheu o local no mapa), origem: "gps" | "manual" }.
export default function useGeolocalizacao() {
  const [estado, setEstado] = useState({ status: "inicial", posicao: null, erro: null });
  const pedidoRef = useRef(0);

  const solicitar = useCallback(() => {
    pedidoRef.current += 1;
    const pedido = pedidoRef.current;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setEstado((atual) => ({ ...atual, status: "indisponivel", erro: MENSAGENS.semSuporte }));
      return;
    }
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setEstado((atual) => ({ ...atual, status: "indisponivel", erro: MENSAGENS.inseguro }));
      return;
    }
    setEstado((atual) => ({ ...atual, status: "solicitando", erro: null }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (pedido !== pedidoRef.current) return;
        setEstado({
          status: "ativa",
          posicao: { lat: coords.latitude, lng: coords.longitude, precisao: coords.accuracy, origem: "gps" },
          erro: null,
        });
      },
      (falha) => {
        if (pedido !== pedidoRef.current) return;
        const status = falha.code === 1 ? "negada" : "erro";
        const erro = falha.code === 1 ? MENSAGENS.negada : falha.code === 3 ? MENSAGENS.tempo : MENSAGENS.indisponivel;
        // Mantém a posição anterior, se houver, para uma atualização que falhou não apagar o resultado na tela.
        setEstado((atual) => ({ status, posicao: atual.posicao, erro }));
      },
      OPCOES,
    );
  }, []);

  const escolherLocal = useCallback(({ lat, lng }) => {
    pedidoRef.current += 1;
    setEstado({ status: "ativa", posicao: { lat, lng, precisao: null, origem: "manual" }, erro: null });
  }, []);

  return { ...estado, solicitar, escolherLocal };
}
