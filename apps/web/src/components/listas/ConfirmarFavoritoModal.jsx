"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import useMontado from "@/hooks/useMontado";

export default function ConfirmarFavoritoModal({ tipo, item, onClose, onConfirm }) {
  const montado = useMontado();
  const acesso = tipo === "acesso";
  const exclusao = tipo === "exclusao";
  const codigo = item?.codigo || item?.codigo_exib || "";
  const nome = item?.nome || item?.nome_exibicao || "Sem nome";
  const instituicao = item?.instituicao || item?.instituicaoNome || "Não informada";

  useEffect(() => {
    if (!item) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [item, onClose]);

  if (!item || !montado) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-[1px]" onClick={onClose} role="presentation">
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-borda-suave bg-superficie p-6 text-texto-forte shadow-[0_20px_50px_rgba(0,0,0,0.18)]" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirmar-favorito-titulo">
        <div className={`absolute inset-x-0 top-0 h-1.5 ${acesso ? "bg-marca" : "bg-destaque"}`} />
        <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-sobre-marca shadow-sm ${acesso ? "bg-marca" : "bg-destaque"}`}>
          <span className="text-2xl" aria-hidden="true">{acesso ? "→" : "!"}</span>
        </div>
        <div className="text-center">
          <h2 id="confirmar-favorito-titulo" className="text-2xl font-extrabold tracking-tight text-texto-forte">
            {acesso ? "Acessar exibição" : exclusao ? "Apagar exibição" : "Remover dos favoritos"}
          </h2>
          {acesso ? (
            <p className="mt-3 text-sm leading-6 text-texto-secundario">
              Deseja acessar esta exibição?
              <span className="mt-3 block font-semibold text-texto-forte">{nome}</span>
              <span className="block font-roboto-mono text-xs">Código: {codigo}</span>
              <span className="block text-xs">Instituição: {instituicao}</span>
            </p>
          ) : exclusao ? (
            <p className="mt-3 text-sm leading-6 text-texto-secundario">
              Deseja mesmo apagar esta exibição?
              <span className="mt-3 block font-semibold text-texto-forte">{nome}</span>
              <span className="block font-roboto-mono text-xs">Código: {codigo}</span>
              <span className="block text-xs">Essa ação removerá a exibição da sua lista.</span>
            </p>
          ) : (
            <p className="mt-3 text-sm leading-6 text-texto-secundario">
              Deseja mesmo remover dos favoritos?
              <span className="mt-3 block font-semibold text-texto-forte">{nome}</span>
              <span className="block text-xs">Isso poderá dificultar seu acesso nessa exibição.</span>
            </p>
          )}
        </div>
        <div className="mt-7 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-borda bg-superficie px-4 py-3 text-sm font-semibold text-texto-suave transition hover:bg-superficie-sutil">Cancelar</button>
          <button type="button" onClick={onConfirm} className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-sobre-marca transition ${acesso ? "bg-marca hover:bg-marca-forte" : "bg-destaque hover:bg-destaque-forte"}`}>{acesso ? "Acessar" : exclusao ? "Apagar" : "Remover"}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
