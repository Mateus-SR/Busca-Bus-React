import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useFavoritosStore = create(
  persist(
    (set, get) => ({
      favoritos: [],
      
      toggleFavorito: (linha) => {
        const favoritosAtuais = get().favoritos;
        const jaExiste = favoritosAtuais.find(f => f.codigo === linha.codigo);
        
        if (jaExiste) {
          set({ favoritos: favoritosAtuais.filter(f => f.codigo !== linha.codigo) });
        } else {
          set({ favoritos: [...favoritosAtuais, linha] });
        }
      },
      
      limparFavoritos: () => set({ favoritos: [] })
    }),
    {
      name: 'bus-favoritos-storage', // Chave salva no armazenamento do celular
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);