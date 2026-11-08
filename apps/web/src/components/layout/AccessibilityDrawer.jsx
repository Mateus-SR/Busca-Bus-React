"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import useGaveta from "@/hooks/useGaveta";
import useMontado from "@/hooks/useMontado";
import { PersonStanding, Contrast, X, AArrowDown, AArrowUp } from "lucide-react";

export default function AccessibilityDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const montado = useMontado();
  const gatilhoRef = useRef(null);
  const painelRef = useRef(null);
  const {
    fontSize,
    increaseFont,
    decreaseFont,
    fontSizeMinimo,
    fontSizeMaximo,
    contrastMode,
    setContrast,
  } = useAccessibility();

  useGaveta({ aberto: isOpen, aoFechar: () => setIsOpen(false), painelRef, gatilhoRef });

  const drawer = (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        data-contraste-ignorar
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-[9990] bg-black/50 transition-[opacity,visibility] duration-300 ease-in-out motion-reduce:transition-none ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

      {/* A animação usa `translate` (o Tailwind v4 não usa `transform`): a transição precisa ser em `translate`. */}
      {/* Recorte `fixed` do tamanho da tela: a gaveta fechada fica fora dele e não alarga o layout no celular (ver MobileNavbar). */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-dvh overflow-hidden">
      <div
        ref={painelRef}
        id="menu-acessibilidade"
        role="dialog"
        aria-modal="true"
        aria-labelledby="acessibilidade-titulo"
        className={`pointer-events-auto absolute top-0 right-0 flex h-full w-[min(80vw,20rem)] flex-col justify-between overflow-y-auto bg-superficie p-5 text-texto-forte shadow-2xl transition-[translate,visibility] duration-300 ease-in-out motion-reduce:transition-none sm:p-6 ${
          isOpen ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between border-b border-borda-suave pb-4">
            <h2 id="acessibilidade-titulo" className="text-lg font-bold">Acessibilidade</h2>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fechar menu de acessibilidade"
              className="flex cursor-pointer items-center justify-center rounded-full px-3 py-2 font-bold transition-colors hover:bg-superficie-forte"
            >
              <X size={24} strokeWidth={3} />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <span className="mb-2 block text-sm font-semibold">Tamanho do Texto</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={decreaseFont}
                  disabled={fontSizeMinimo}
                  aria-label="Diminuir tamanho do texto"
                  className="flex items-center justify-center gap-2 rounded-xl border border-borda bg-superficie-sutil px-4 py-2.5 text-sm font-bold text-texto transition-all duration-200 hover:bg-superficie-hover cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-superficie-sutil"
                >
                  Diminuir <AArrowDown size={18} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={increaseFont}
                  disabled={fontSizeMaximo}
                  aria-label="Aumentar tamanho do texto"
                  className="flex items-center justify-center gap-2 rounded-xl border border-borda bg-superficie-sutil px-4 py-2.5 text-sm font-bold text-texto transition-all duration-200 hover:bg-superficie-hover cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-superficie-sutil"
                >
                  Aumentar <AArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
              <p className="mt-1.5 text-sm">Atual: {fontSize === "normal" ? "Normal" : fontSize === "large" ? "Grande" : "Muito Grande"}</p>
            </div>

            <div>
              <span className="mb-2 block text-sm font-semibold">Esquema de Cores</span>
              <div className="space-y-2">
                <button onClick={() => setContrast("normal")} aria-pressed={contrastMode === "normal"} className={`w-full cursor-pointer rounded-xl border px-4 py-2.5 font-bold transition-all duration-200 ${contrastMode === "normal" ? "border-gray-800 bg-gray-800 text-white shadow-md" : "border-borda bg-superficie-alt text-texto-forte hover:border-borda-forte hover:bg-superficie-forte"}`}>
                  Padrão (Original)
                </button>
                <button onClick={() => setContrast("dark")} aria-pressed={contrastMode === "dark"} data-contraste-ignorar className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-bold transition-all duration-200 ${contrastMode === "dark" ? "border-yellow-500 bg-yellow-400 text-black shadow-md" : "border-black bg-black text-white hover:border-yellow-400 hover:bg-gray-800"}`}>
                  <Contrast size={16} /> Alto Contraste Escuro
                </button>
                <button onClick={() => setContrast("light")} aria-pressed={contrastMode === "light"} data-contraste-ignorar className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-bold transition-all duration-200 ${contrastMode === "light" ? "border-blue-700 bg-blue-600 text-white shadow-md" : "border-black bg-white text-black shadow-sm hover:border-blue-600 hover:bg-gray-100"}`}>
                  <Contrast size={16} className="rotate-180" /> Alto Contraste Claro
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        ref={gatilhoRef}
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-controls="menu-acessibilidade"
        aria-label={isOpen ? "Fechar menu de acessibilidade" : "Abrir menu de acessibilidade"}
        className="font-bold rounded-xl p-2 border-sobre-marca border-[3px] text-sobre-marca hover:bg-sobre-marca/50 transition-all duration-200 ease-out cursor-pointer"
        
        title="Acessibilidade"
      >
        <PersonStanding strokeWidth={3} />
      </button>

      {montado && createPortal(drawer, document.body)}
    </div>
  );
}