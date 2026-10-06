import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export function criarFavoritosStore(storage) {
  return create(
    persist(
      (set, get) => ({
        favoritos: [],
        toggleFavorito: (linha) => {
          const favoritosAtuais = get().favoritos;
          const jaExiste = favoritosAtuais.find((favorito) => favorito.codigo === linha.codigo);

          set({
            favoritos: jaExiste
              ? favoritosAtuais.filter((favorito) => favorito.codigo !== linha.codigo)
              : [...favoritosAtuais, linha],
          });
        },
        limparFavoritos: () => set({ favoritos: [] }),
      }),
      {
        name: "bus-favoritos-storage",
        storage: createJSONStorage(() => storage),
      },
    ),
  );
}
