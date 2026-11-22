"use client";

import { useRef, useState } from "react";

// Painel inferior do celular com três posições. `limites` = { recolhido, medio, expandido } em px (ou null enquanto não mediu).
// Arrastar pela alça acompanha o dedo e, ao soltar, assenta na posição mais próxima (levando em conta a velocidade do gesto);
// tocar na alça (ou Enter/Espaço) passa para a próxima posição, e as setas do teclado sobem e descem.
export const ESTADOS_PAINEL = ["recolhido", "medio", "expandido"];

const LIMIAR_ARRASTO_PX = 6;
const PROJECAO_MS = 180;
const IGNORAR_CLIQUE_APOS_ARRASTO_MS = 350;

export default function usePainelArrastavel(limites, estadoInicial = "medio") {
  const [estado, setEstado] = useState(estadoInicial);
  const [alturaArrasto, setAlturaArrasto] = useState(null);
  const arrastoRef = useRef(null);
  const ultimoArrastoRef = useRef(-Infinity);

  function aoPressionar(evento) {
    if (!limites || (evento.pointerType === "mouse" && evento.button !== 0)) return;
    const alturaInicial = limites[estado];
    arrastoRef.current = { yInicial: evento.clientY, alturaInicial, altura: alturaInicial, yAnterior: evento.clientY, tAnterior: evento.timeStamp, velocidade: 0, moveu: false };
    evento.currentTarget.setPointerCapture(evento.pointerId);
  }

  function aoMover(evento) {
    const arrasto = arrastoRef.current;
    if (!arrasto || !limites) return;
    const deslocamento = arrasto.yInicial - evento.clientY;
    if (!arrasto.moveu && Math.abs(deslocamento) < LIMIAR_ARRASTO_PX) return;
    arrasto.moveu = true;
    arrasto.velocidade = (arrasto.yAnterior - evento.clientY) / Math.max(1, evento.timeStamp - arrasto.tAnterior);
    arrasto.yAnterior = evento.clientY;
    arrasto.tAnterior = evento.timeStamp;
    arrasto.altura = Math.min(limites.expandido, Math.max(limites.recolhido, arrasto.alturaInicial + deslocamento));
    setAlturaArrasto(arrasto.altura);
  }

  function aoSoltar(evento) {
    const arrasto = arrastoRef.current;
    arrastoRef.current = null;
    if (!arrasto?.moveu || !limites) return;
    ultimoArrastoRef.current = evento.timeStamp;
    const projetada = arrasto.altura + arrasto.velocidade * PROJECAO_MS;
    const maisProximo = ESTADOS_PAINEL.reduce(
      (melhor, nome) => (Math.abs(limites[nome] - projetada) < Math.abs(limites[melhor] - projetada) ? nome : melhor),
      estado,
    );
    setAlturaArrasto(null);
    setEstado(maisProximo);
  }

  function aoCancelar() {
    arrastoRef.current = null;
    setAlturaArrasto(null);
  }

  function aoClicar(evento) {
    // O toque que termina um arrasto também gera um clique: não deve contar como "alternar".
    if (evento.timeStamp - ultimoArrastoRef.current < IGNORAR_CLIQUE_APOS_ARRASTO_MS) return;
    setEstado((atual) => ESTADOS_PAINEL[(ESTADOS_PAINEL.indexOf(atual) + 1) % ESTADOS_PAINEL.length]);
  }

  function aoTeclar(evento) {
    const delta = evento.key === "ArrowUp" ? 1 : evento.key === "ArrowDown" ? -1 : 0;
    if (!delta) return;
    evento.preventDefault();
    setEstado((atual) => ESTADOS_PAINEL[Math.min(ESTADOS_PAINEL.length - 1, Math.max(0, ESTADOS_PAINEL.indexOf(atual) + delta))]);
  }

  return {
    estado,
    setEstado,
    arrastando: alturaArrasto !== null,
    altura: alturaArrasto ?? (limites ? limites[estado] : null),
    // Altura "assentada", sem o arrasto em andamento: é a que importa para enquadrar o mapa.
    alturaAssentada: limites ? limites[estado] : 0,
    propsAlca: { onPointerDown: aoPressionar, onPointerMove: aoMover, onPointerUp: aoSoltar, onPointerCancel: aoCancelar, onClick: aoClicar, onKeyDown: aoTeclar },
  };
}
