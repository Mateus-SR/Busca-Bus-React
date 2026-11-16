"use client";

import useEstadoNotificacoesSistema from "@/hooks/useEstadoNotificacoesSistema";
import { ativarNotificacoesSistema } from "@/lib/notificacoesSistema";

const TEXTOS = {
  granted: "Ativados. Com esta aba em segundo plano, você recebe uma notificação do aparelho, com o som padrão do navegador.",
  denied: "Estão bloqueados neste navegador. Libere as notificações deste site nas configurações do navegador para receber avisos com a aba em segundo plano.",
  "ios-instalar": "No iPhone e no iPad, os avisos do sistema só funcionam com o Busca Bus instalado na tela inicial: toque em Compartilhar e depois em Adicionar à Tela de Início. Por enquanto, os avisos aparecem aqui na tela, com a aba aberta.",
  "nao-suportado": "Este navegador não permite notificações do sistema (ou o site não está em HTTPS). Os avisos aparecem só aqui na tela, com a aba aberta.",
};

// Seção do diálogo de avisos: liga as notificações do sistema, usadas só quando a aba está em segundo plano.
export default function AvisosDoSistema() {
  const estado = useEstadoNotificacoesSistema();
  if (estado === "indisponivel") return null;

  return (
    <section aria-labelledby="avisos-sistema-titulo" className="mt-5">
      <h3 id="avisos-sistema-titulo" className="text-sm font-extrabold uppercase">Avisos do sistema</h3>
      {estado === "default" ? (
        <>
          <p className="mt-2 text-sm text-texto-suave">
            Receba uma notificação do aparelho quando esta aba estiver em segundo plano. Funciona enquanto a página
            continuar aberta; com a página fechada, nada é enviado.
          </p>
          <button
            type="button"
            onClick={() => void ativarNotificacoesSistema()}
            className="mt-2 cursor-pointer rounded-md bg-marca px-3 py-2 text-sm font-semibold text-sobre-marca transition hover:bg-marca-forte"
          >
            Ativar avisos do sistema
          </button>
        </>
      ) : (
        <p className="mt-2 text-sm text-texto-suave">{TEXTOS[estado]}</p>
      )}
    </section>
  );
}
