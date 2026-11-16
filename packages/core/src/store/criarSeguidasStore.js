import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { criarSeguida, normalizarConfigSeguida } from "../notificacoes.js";

// Linhas que o usuário segue, por exibição: `{ [codigoExibicao]: { [chave]: seguida } }`.
// Mesmo formato de `criarFavoritosStore`: o app injeta o storage (localStorage na web, AsyncStorage no React Native).
export function criarSeguidasStore(storage) {
  return create(
    persist(
      (set, get) => ({
        seguidas: {},
        seguir: (exibicao, linha, config) => {
          const seguida = criarSeguida(linha, config);
          const codigo = String(exibicao);
          const daExibicao = get().seguidas[codigo] ?? {};
          set({ seguidas: { ...get().seguidas, [codigo]: { ...daExibicao, [seguida.chave]: seguida } } });
        },
        pararDeSeguir: (exibicao, chave) => {
          const codigo = String(exibicao);
          const daExibicao = get().seguidas[codigo];
          if (!daExibicao?.[chave]) return;
          const seguidas = { ...get().seguidas };
          const restantes = { ...daExibicao };
          delete restantes[chave];
          // Exibição sem nenhuma linha seguida some do mapa, para o storage não acumular chaves vazias.
          if (Object.keys(restantes).length) seguidas[codigo] = restantes;
          else delete seguidas[codigo];
          set({ seguidas });
        },
        atualizarSeguida: (exibicao, chave, alteracoes) => {
          const codigo = String(exibicao);
          const atual = get().seguidas[codigo]?.[chave];
          if (!atual) return;
          const config = normalizarConfigSeguida({
            minutosChegando: alteracoes.minutosChegando ?? atual.minutosChegando,
            eventos: { ...atual.eventos, ...alteracoes.eventos },
          });
          set({ seguidas: { ...get().seguidas, [codigo]: { ...get().seguidas[codigo], [chave]: { ...atual, ...config } } } });
        },
        limparSeguidas: () => set({ seguidas: {} }),
      }),
      {
        name: "bus-seguidas-storage",
        version: 1,
        storage: createJSONStorage(() => storage),
      },
    ),
  );
}
