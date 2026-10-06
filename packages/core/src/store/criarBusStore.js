import { create } from "zustand";

export function criarBusStore(clienteApi) {
  return create((set) => ({
    linhasAtivas: [],
    isLoading: false,
    erro: null,
    fetchLinhas: async () => {
      set({ isLoading: true, erro: null });
      try {
        const linhasAtivas = await clienteApi.listarLinhas();
        set({ linhasAtivas, isLoading: false });
      } catch (error) {
        set({ erro: error instanceof Error ? error.message : "Falha ao buscar localização dos ônibus", isLoading: false });
      }
    },
    limparLinhas: () => set({ linhasAtivas: [] }),
  }));
}
