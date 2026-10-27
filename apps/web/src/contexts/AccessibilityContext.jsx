"use client";

import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState('normal');
  const [contrastMode, setContrastMode] = useState('normal'); // 'normal', 'dark', 'light'
  // Só grava no localStorage depois de ler o que já estava salvo. Sem isso, o efeito de gravação roda
  // na montagem com o padrão ('normal') e sobrescreve a preferência antes de ela ser lida.
  const preferenciasLidas = useRef(false);

  useEffect(() => {
    const tarefa = window.setTimeout(() => {
      try {
        const salvo = localStorage.getItem('accessibilityPreferences');
        if (salvo) {
          const preferencias = JSON.parse(salvo);
          if (['normal', 'large', 'xlarge'].includes(preferencias.fontSize)) setFontSize(preferencias.fontSize);
          if (['normal', 'dark', 'light'].includes(preferencias.contrastMode)) setContrastMode(preferencias.contrastMode);
        }
      } catch (erro) {
        console.error('Erro ao carregar preferências de acessibilidade', erro);
        localStorage.removeItem('accessibilityPreferences');
      }
      preferenciasLidas.current = true;
    }, 0);
    return () => window.clearTimeout(tarefa);
  }, []);

  useEffect(() => {
    // Antes da leitura, o estado ainda é o padrão: aplicar/gravar agora apagaria a preferência salva.
    if (!preferenciasLidas.current) return;

    // Sem atributo = normal. O mesmo mapeamento roda no script do layout.js, antes da primeira pintura.
    const root = document.documentElement;

    if (fontSize === 'normal') delete root.dataset.fonte;
    else root.dataset.fonte = fontSize;

    if (contrastMode === 'dark') root.dataset.contraste = 'escuro';
    else if (contrastMode === 'light') root.dataset.contraste = 'claro';
    else delete root.dataset.contraste;
    localStorage.setItem('accessibilityPreferences', JSON.stringify({ fontSize, contrastMode }));
  }, [fontSize, contrastMode]);

  const increaseFont = () => setFontSize(prev => prev === 'normal' ? 'large' : 'xlarge');
  const decreaseFont = () => setFontSize(prev => prev === 'xlarge' ? 'large' : 'normal');
  const fontSizeMinimo = fontSize === 'normal';
  const fontSizeMaximo = fontSize === 'xlarge';
  const setContrast = (mode) => setContrastMode(mode);

  return (
    <AccessibilityContext.Provider value={{ fontSize, increaseFont, decreaseFont, fontSizeMinimo, fontSizeMaximo, contrastMode, setContrast }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
