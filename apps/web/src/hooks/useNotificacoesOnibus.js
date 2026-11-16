"use client";

import { useEffect, useRef } from "react";
import { criarEstadoDeteccao, detectarEventos, montarNotificacoes } from "@busca-bus/core";

// Liga o radar às notificações das linhas seguidas: a cada resposta nova do radar roda a detecção (função pura do core)
// e entrega o que houver para `aoNotificar(notificacoes, { abaVisivel })`. Não faz rede: só olha a lista que já chegou.
//
// `pronto` precisa ficar falso até a primeira resposta real do radar. Se o primeiro lote fosse a lista vazia de antes
// do carregamento, a lista de verdade viria depois como "apareceu" para todos os ônibus.
export default function useNotificacoesOnibus({ onibus, pronto, seguidas, nomePonto, aoNotificar }) {
  const estadoRef = useRef(criarEstadoDeteccao());
  // Valores que mudam sem que a detecção deva rodar de novo (só uma resposta nova do radar dispara).
  const ultimoRef = useRef({ seguidas, nomePonto, aoNotificar });

  useEffect(() => {
    ultimoRef.current = { seguidas, nomePonto, aoNotificar };
  });

  useEffect(() => {
    if (!pronto) return;
    const { seguidas: atuais, nomePonto: nome, aoNotificar: entregar } = ultimoRef.current;
    const { estado, eventos } = detectarEventos(estadoRef.current, onibus, atuais);
    estadoRef.current = estado;
    if (!eventos.length) return;
    entregar(montarNotificacoes(eventos, { nomePonto: nome }), {
      abaVisivel: document.visibilityState === "visible",
    });
  }, [onibus, pronto]);
}
