"use client";

import { useEffect, useRef } from "react";

const SELETOR_FOCAVEL =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Comportamento comum das gavetas (menu de navegação e menu de acessibilidade) enquanto abertas:
// - Esc fecha;
// - o foco vai para dentro do painel, fica preso nele (Tab/Shift+Tab) e volta ao botão que abriu;
// - a página atrás não rola (compensando a barra de rolagem para o layout não "pular" no desktop).
export default function useGaveta({ aberto, aoFechar, painelRef, gatilhoRef }) {
  const aoFecharRef = useRef(aoFechar);
  useEffect(() => {
    aoFecharRef.current = aoFechar;
  });

  useEffect(() => {
    if (!aberto) return undefined;
    const painel = painelRef.current;
    const gatilho = gatilhoRef.current;
    if (!painel) return undefined;

    const corpo = document.body;
    const anterior = { overflow: corpo.style.overflow, paddingRight: corpo.style.paddingRight };
    const larguraBarra = window.innerWidth - document.documentElement.clientWidth;
    corpo.style.overflow = "hidden";
    if (larguraBarra > 0) {
      corpo.style.paddingRight = `${larguraBarra + (parseFloat(getComputedStyle(corpo).paddingRight) || 0)}px`;
    }

    const focaveis = () => Array.from(painel.querySelectorAll(SELETOR_FOCAVEL));
    // No quadro seguinte: no primeiro quadro da transição o painel ainda conta como `visibility: hidden` e não aceita foco.
    const quadro = requestAnimationFrame(() => focaveis()[0]?.focus());

    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        aoFecharRef.current();
        return;
      }
      if (evento.key !== "Tab") return;
      const itens = focaveis();
      if (!itens.length) return;
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      const fora = !painel.contains(document.activeElement);
      if (evento.shiftKey && (fora || document.activeElement === primeiro)) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && (fora || document.activeElement === ultimo)) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      cancelAnimationFrame(quadro);
      corpo.style.overflow = anterior.overflow;
      corpo.style.paddingRight = anterior.paddingRight;
      gatilho?.focus();
    };
  }, [aberto, painelRef, gatilhoRef]);
}
