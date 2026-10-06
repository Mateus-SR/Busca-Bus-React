"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState('normal'); 
  const [contrastMode, setContrastMode] = useState('normal'); // 'normal', 'dark', 'light'

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