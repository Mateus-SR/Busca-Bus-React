"use client";

import { useEffect } from "react";

export default function ConfirmLogoutModal({ aberto, onClose, onConfirm }) {
  useEffect(() => {
    if (!aberto) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [aberto, onClose]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative mx-auto w-full max-w-md -translate-y-0 overflow-hidden rounded-[28px] border border-red-200 bg-white p-6 text-slate-900 shadow-[0_30px_80px_rgba(127,29,29,0.32)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-sair-titulo"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-400" />

        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-inner shadow-red-200/80">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-7 w-7">
            <path d="M12 9v4m0 4h.01M5.7 19h12.6a2.1 2.1 0 0 0 1.9-2.9L13.9 4.5a2.1 2.1 0 0 0-3.8 0L3.8 16.1A2.1 2.1 0 0 0 5.7 19Z" />
          </svg>
        </div>

        <div className="text-center">
          <h2 id="confirmar-sair-titulo" className="text-2xl font-extrabold tracking-tight text-red-700">
            Sair da conta
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Tem certeza que você gostaria de sair da sua conta?
          </p>
        </div>

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-gradient-to-r from-red-700 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition hover:brightness-110"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
