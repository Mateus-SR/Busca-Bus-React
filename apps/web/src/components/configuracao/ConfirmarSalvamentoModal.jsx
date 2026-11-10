"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { createPortal } from "react-dom";
import useMontado from "@/hooks/useMontado";

export default function ConfirmarSalvamentoModal({ aberto, atualizado, codigo, onClose, onAcessar }) {
  const montado = useMontado();

  useEffect(() => {
    if (!aberto) return undefined;
    const fecharComEscape = (evento) => {
      if (evento.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fecharComEscape);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fecharComEscape);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, onClose]);

  if (!aberto || !montado) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-[1px]" onClick={onClose} role="presentation">
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-borda-suave bg-superficie p-6 text-texto-forte shadow-[0_20px_50px_rgba(0,0,0,0.18)]" onClick={(evento) => evento.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="salvamento-titulo">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-sucesso" />
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sucesso text-sobre-sucesso shadow-sm"><CheckCircle2 size={29} aria-hidden="true" /></div>
        <div className="text-center">
          <h2 id="salvamento-titulo" className="text-2xl font-extrabold tracking-tight text-texto-forte">{atualizado ? "Exibição atualizada!" : "Exibição criada!"}</h2>
          <p className="mt-3 text-sm leading-6 text-texto-secundario">Código da exibição: <strong className="font-roboto-mono text-texto-forte">{codigo}</strong></p>
          <p className="text-sm leading-6 text-texto-secundario">Deseja acessá-la agora?</p>
        </div>
        <div className="mt-7 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-borda bg-superficie px-4 py-3 text-sm font-semibold text-texto-suave transition hover:bg-superficie-sutil">Continuar aqui</button>
          <button type="button" onClick={onAcessar} className="flex-1 rounded-xl bg-marca px-4 py-3 text-sm font-semibold text-sobre-marca transition hover:bg-marca-forte">Acessar</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
