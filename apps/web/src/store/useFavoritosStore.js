import { criarFavoritosStore } from "@busca-bus/core/store";

export const useFavoritosStore = criarFavoritosStore(
  typeof window === "undefined" ? undefined : window.localStorage,
);