"use client";

import { useState } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { PersonStanding, Contrast, X, AArrowDown, AArrowUp } from "lucide-react";

export default function AccessibilityDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { fontSize, increaseFont, decreaseFont, contrastMode, setContrast } = useAccessibility();

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

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-9990 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`accessibility-drawer fixed top-0 right-0 h-full w-80 bg-white dark:bg-sptrans text-gray-900 dark:text-white shadow-2xl z-9999 transform transition-transform duration-300 ease-in-out p-6 flex flex-col justify-between ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-red-800">
            <h2 className="text-lg font-bold">Acessibilidade</h2>
            <button 
              onClick={() => setIsOpen(false)}
              aria-label="Fechar menu de acessibilidade"
              className="px-3 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-red-800 transition-colors font-bold cursor-pointer flex items-center justify-center"
            >
              <X size={24} strokeWidth={3} />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            
            {/* Tamanho da Fonte */}
            <div>
              <span className="block text-sm font-semibold mb-2">Tamanho do Texto</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={decreaseFont}
                  className="py-2.5 px-4 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-300 text-black font-bold transition-all duration-200 text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  Diminuir <AArrowDown size={18} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={increaseFont}
                  className="py-2.5 px-4 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-300 text-black font-bold transition-all duration-200 text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  Aumentar <AArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
              <p className="text-sm text-gray-150 mt-1.5">Atual: {fontSize === 'normal' ? 'Normal' : fontSize === 'large' ? 'Grande' : 'Muito Grande'}</p>
            </div>

            {/* Modos de Contraste */}
            <div>
              <span className="block text-sm font-semibold mb-2">Esquema de Cores</span>
              <div className="space-y-2">
                <button 
                  onClick={() => setContrast('normal')}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold transition-all duration-200 border cursor-pointer ${
                    contrastMode === 'normal' 
                      ? 'bg-gray-800 text-white border-gray-800 shadow-md' 
                      : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
                  }`}
                >
                  Padrão (Original)
                </button>
                <button 
                  onClick={() => setContrast('dark')}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold transition-all duration-200 border cursor-pointer flex items-center justify-center gap-2 ${
                    contrastMode === 'dark' 
                      ? 'bg-yellow-400 text-black border-yellow-500 shadow-md' 
                      : 'bg-black text-white border-black hover:bg-gray-800 hover:border-yellow-400'
                  }`}
                >
                  <Contrast size={16} /> Alto Contraste Escuro
                </button>
                <button 
                  onClick={() => setContrast('light')}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold transition-all duration-200 border cursor-pointer flex items-center justify-center gap-2 ${
                    contrastMode === 'light' 
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                      : 'bg-white text-black border-black hover:bg-gray-100 hover:border-blue-600 shadow-sm'
                  }`}
                >
                  <Contrast size={16} className="rotate-180" /> Alto Contraste Claro
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}