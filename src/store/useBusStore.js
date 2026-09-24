
import { create } from 'zustand';

export const useBusStore = create((set) => ({
  linhasAtivas: [],
  isLoading: false,
  erro: null,
  
  
  fetchLinhas: async () => {
    set({ isLoading: true, erro: null });
    try {
      // precisa colocar a api aqui
      const response = await fetch('SUA_API_AQUI');
      const data = await response.json();
      set({ linhasAtivas: data, isLoading: false });
    } catch (error) {
      set({ erro: 'Falha ao buscar localização dos ônibus', isLoading: false });
    }
  },

  limparLinhas: () => set({ linhasAtivas: [] })
}));