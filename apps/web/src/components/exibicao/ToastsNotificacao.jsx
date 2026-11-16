"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import useMontado from "@/hooks/useMontado";

const DURACAO_MS = 8000;

function ToastNotificacao({ toast, aoFechar }) {
  useEffect(() => {
    const timeout = setTimeout(() => aoFechar(toast.id), DURACAO_MS);
    return () => clearTimeout(timeout);
  }, [toast.id, aoFechar]);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-borda bg-superficie px-4 py-3 text-left shadow-xl">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-texto-forte">{toast.titulo}</p>
        {toast.corpo && <p className="mt-0.5 text-sm text-texto-suave">{toast.corpo}</p>}
      </div>
      <button
        type="button"
        onClick={() => aoFechar(toast.id)}
        aria-label="Fechar aviso"
        className="shrink-0 cursor-pointer rounded-md p-1 text-texto-mudo transition hover:bg-superficie-alt"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

// Avisos das linhas seguidas, mostrados com a aba visível. Propositalmente sem aria-live: o leitor de tela já anuncia
// os ônibus novos em ExibicaoLive, e duplicar o anúncio atrapalharia mais do que ajudaria.
export default function ToastsNotificacao({ toasts, aoFechar }) {
  const montado = useMontado();
  if (!montado || !toasts.length) return null;

  return createPortal(
    <div
      role="group"
      aria-label="Avisos das linhas que você segue"
      className="fixed right-4 bottom-4 z-[9999] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:right-5 sm:bottom-5"
    >
      {toasts.map((toast) => (
        <ToastNotificacao key={toast.id} toast={toast} aoFechar={aoFechar} />
      ))}
    </div>,
    document.body,
  );
}
