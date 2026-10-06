"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { PersonStanding, Contrast, X, AArrowDown, AArrowUp } from "lucide-react";

export default function AccessibilityDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const {
    fontSize,
    increaseFont,
    decreaseFont,
    fontSizeMinimo,
    fontSizeMaximo,
    contrastMode,
    setContrast,
  } = useAccessibility();

  const drawer = (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9990] bg-black opacity-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`accessibility-drawer fixed top-0 right-0 z-[9999] flex h-full w-80 transform flex-col justify-between bg-white p-6 text-gray-900 shadow-2xl transition-transform duration-300 ease-in-out dark:bg-sptrans dark:text-white ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div>
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-red-800">
            <h2 className="text-lg font-bold">Acessibilidade</h2>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fechar menu de acessibilidade"
              className="flex cursor-pointer items-center justify-center rounded-full px-3 py-2 font-bold transition-colors hover:bg-gray-200 dark:hover:bg-red-800"
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
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-bold text-black transition-all duration-200 hover:bg-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-50"
                >
                  Diminuir <AArrowDown size={18} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={increaseFont}
                  disabled={fontSizeMaximo}
                  aria-label="Aumentar tamanho do texto"
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-bold text-black transition-all duration-200 hover:bg-gray-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-50"
                >
                  Aumentar <AArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
              <p className="mt-1.5 text-sm text-gray-150">Atual: {fontSize === "normal" ? "Normal" : fontSize === "large" ? "Grande" : "Muito Grande"}</p>
            </div>

            <div>
              <span className="mb-2 block text-sm font-semibold">Esquema de Cores</span>
              <div className="space-y-2">
                <button onClick={() => setContrast("normal")} className={`w-full cursor-pointer rounded-xl border px-4 py-2.5 font-bold transition-all duration-200 ${contrastMode === "normal" ? "border-gray-800 bg-gray-800 text-white shadow-md" : "border-gray-300 bg-gray-100 text-gray-900 hover:border-gray-400 hover:bg-gray-200"}`}>
                  Padrão (Original)
                </button>
                <button onClick={() => setContrast("dark")} className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-bold transition-all duration-200 ${contrastMode === "dark" ? "border-yellow-500 bg-yellow-400 text-black shadow-md" : "border-black bg-black text-white hover:border-yellow-400 hover:bg-gray-800"}`}>
                  <Contrast size={16} /> Alto Contraste Escuro
                </button>
                <button onClick={() => setContrast("light")} className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-bold transition-all duration-200 ${contrastMode === "light" ? "border-blue-700 bg-blue-600 text-white shadow-md" : "border-black bg-white text-black shadow-sm hover:border-blue-600 hover:bg-gray-100"}`}>
                  <Contrast size={16} className="rotate-180" /> Alto Contraste Claro
                </button>
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
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu de acessibilidade"
        className="font-bold rounded-xl p-2 border-white border-[3px] text-white hover:bg-white/50 transition-all duration-200 ease-out cursor-pointer"
        
        title="Acessibilidade"
      >
        <PersonStanding strokeWidth={3} />
      </button>

      {montado && createPortal(drawer, document.body)}
    </div>
  );
}