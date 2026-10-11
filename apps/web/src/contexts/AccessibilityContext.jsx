"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState('normal'); 
  const [contrastMode, setContrastMode] = useState('normal'); // 'normal', 'dark', 'light'

  useEffect(() => {
    const tarefa = window.setTimeout(() => {
      const salvo = localStorage.getItem('accessibilityPreferences');
      if (!salvo) return;
      try {
        const preferencias = JSON.parse(salvo);
        if (['normal', 'large', 'xlarge'].includes(preferencias.fontSize)) setFontSize(preferencias.fontSize);
        if (['normal', 'dark', 'light'].includes(preferencias.contrastMode)) setContrastMode(preferencias.contrastMode);
      } catch (erro) {
        console.error('Erro ao carregar preferências de acessibilidade', erro);
        localStorage.removeItem('accessibilityPreferences');
      }
    }, 0);
    return () => window.clearTimeout(tarefa);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Gerenciar tamanhos de fonte
    root.classList.remove('text-normal', 'text-large', 'text-xlarge');
    root.classList.add(`text-${fontSize}`);
    
    // Gerenciar modos de contraste
    root.classList.remove('high-contrast-dark', 'high-contrast-light');
    if (contrastMode === 'dark') {
      root.classList.add('high-contrast-dark');
    } else if (contrastMode === 'light') {
      root.classList.add('high-contrast-light');
    }
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