import { criarFavoritosStore } from "@busca-bus/core";

export const useFavoritosStore = criarFavoritosStore(
  typeof window === "undefined" ? undefined : window.localStorage,
);