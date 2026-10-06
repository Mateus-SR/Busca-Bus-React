"use client";

import { useState } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

export default function AccessibilityDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { fontSize, increaseFont, decreaseFont, contrastMode, setContrast } = useAccessibility();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu de acessibilidade"
        className="p-2.5 rounded-xl border-2 border-white/50 bg-white/10 hover:bg-white/30 hover:scale-105 font-bold flex items-center justify-center transition-all duration-200 text-white cursor-pointer"
        title="Acessibilidade"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="h-5 w-5"
        >
          <circle cx="12" cy="5" r="1"/>
          <path d="m9 20 3-6 3 6"/>
          <path d="m6 8 6 2 6-2"/>
          <path d="M12 10v4"/>
        </svg>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`accessibility-drawer fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out p-6 flex flex-col justify-between ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold">Acessibilidade</h2>
            <button 
              onClick={() => setIsOpen(false)}
              aria-label="Fechar menu de acessibilidade"
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mt-6 space-y-6">
            
            {/* Tamanho da Fonte */}
            <div>
              <span className="block text-sm font-semibold mb-2">Tamanho do Texto</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={decreaseFont}
                  className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold transition-all duration-200 text-sm cursor-pointer"
                >
                  Diminuir (A-)
                </button>
                <button 
                  onClick={increaseFont}
                  className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold transition-all duration-200 text-sm cursor-pointer"
                >
                  Aumentar (A+)
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Atual: {fontSize === 'normal' ? 'Normal' : fontSize === 'large' ? 'Grande' : 'Muito Grande'}</p>
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
                  className={`w-full py-2.5 px-4 rounded-xl font-bold transition-all duration-200 border cursor-pointer ${
                    contrastMode === 'dark' 
                      ? 'bg-yellow-400 text-black border-yellow-500 shadow-md' 
                      : 'bg-black text-white border-black hover:bg-gray-800 hover:border-yellow-400'
                  }`}
                >
                  ◐ Alto Contraste Escuro
                </button>
                <button 
                  onClick={() => setContrast('light')}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold transition-all duration-200 border cursor-pointer ${
                    contrastMode === 'light' 
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                      : 'bg-white text-black border-black hover:bg-gray-100 hover:border-blue-600 shadow-sm'
                  }`}
                >
                  ◑ Alto Contraste Claro
                </button>
              </div>
            </div>

          </div>
        </div>

        <div className="text-xs text-center text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-800">
          BuscaBus • Inclusão e Mobilidade
        </div>
      </div>
    </div>
  );
}