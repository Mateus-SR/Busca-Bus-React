
"use client";

import { createPortal } from "react-dom";
import useMontado from "@/hooks/useMontado";

export default function InlineToast({ mensagens = [], mensagem = null }) {
  const montado = useMontado();

  const lista = mensagens.length > 0
    ? mensagens
    : mensagem
      ? [mensagem]
      : [];

  if (!montado || lista.length === 0) return null;

  return createPortal(
    <div className="fixed top-[4.5rem] right-4 z-[1100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:top-20 sm:right-5">
      {lista.map((item, index) => (
        <div
          key={item.id ?? index}
          role="status"
          aria-live="polite"
          className={`rounded-xl border border-borda-suave bg-superficie px-4 py-3 text-left text-sm font-semibold text-texto-forte shadow-xl ${item.cor || ""}`}
        >
          {item.texto}
        </div>
      ))}
    </div>,
    document.body
  );
}
