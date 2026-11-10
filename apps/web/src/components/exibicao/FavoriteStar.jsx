"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { criarClienteApi } from "@busca-bus/core/cliente";
import InlineToast from "@/components/ui/InlineToast";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FavoriteStar({ codigo }) {
  const [favoritado, setFavoritado] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const { accessToken, estaLogado, carregando: carregandoAuth } = useAuth();

  useEffect(() => {
    if (carregandoAuth) return;
    if (!API_URL || !accessToken || !codigo) {
      setCarregando(false);
      return;
    }
    let cancelado = false;
    const cliente = criarClienteApi(API_URL);
    cliente.verificarFavorito(codigo, accessToken)
      .then((resposta) => {
        if (!cancelado) setFavoritado(Boolean(resposta.favoritado));
      })
      .catch(() => {
        if (!cancelado) setMensagem({
          id: Date.now(),
          texto: "Não foi possível carregar o favorito",
          cor: "bg-destaque text-sobre-destaque",
        });
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [accessToken, carregandoAuth, codigo]);

  async function alternarFavorito() {
    if (!estaLogado || !API_URL || !accessToken || carregando) {
      setMensagem({
        id: Date.now(),
        texto: !estaLogado
          ? "Faça login para favoritar uma exibição"
          : "Favoritos indisponíveis sem conexão com o servidor",
        cor: "bg-destaque text-sobre-destaque",
      });
      return;
    }
    const novoValor = !favoritado;
    setFavoritado(novoValor);
    setMensagem({
      id: Date.now(),
      texto: novoValor
        ? "Exibição adicionada aos favoritos"
        : "Exibição removida dos favoritos",
      cor: novoValor ? "bg-sucesso text-sobre-sucesso" : "bg-destaque text-sobre-destaque",
    });
    try {
      const cliente = criarClienteApi(API_URL);
      if (novoValor) await cliente.favoritar(codigo, accessToken);
      else await cliente.desfavoritar(codigo, accessToken);
    } catch (error) {
      setFavoritado(!novoValor);
      setMensagem({
        id: Date.now(),
        texto: error.message || "Não foi possível atualizar o favorito",
        cor: "bg-destaque text-sobre-destaque",
      });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={alternarFavorito}
        disabled={carregandoAuth || carregando}
        aria-label={favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className="cursor-pointer text-yellow-400 transition-transform duration-300 active:scale-125 disabled:cursor-wait disabled:opacity-60"
      >
        <Star size={24} fill={favoritado ? "currentColor" : "none"} />
      </button>
      <InlineToast key={mensagem?.id} mensagem={mensagem} />
    </div>
  );
}
