import { criarSeguidasStore } from "@busca-bus/core/store";

export const useSeguidasStore = criarSeguidasStore(
  typeof window === "undefined" ? undefined : window.localStorage,
);
