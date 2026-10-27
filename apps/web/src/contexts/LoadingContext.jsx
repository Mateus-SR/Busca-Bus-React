"use client";

import { createContext, useContext, useState } from "react";

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);

  function startLoading(texto = "Carregando...", subtexto = "") {
    setLoading({ texto, subtexto, erro: false });
  }

  function stopLoading() {
    setLoading(null);
  }

  function showError(texto, subtexto = "") {
    setLoading({ texto, subtexto, erro: true });
  }

  function confirm(opcoes = {}) {
    const {
      mensagem = "Tem certeza que deseja continuar?",
      simTexto = "Sim",
      naoTexto = "Não",
    } = typeof opcoes === "string"
      ? { simTexto: opcoes }
      : opcoes;

    return new Promise((resolve) => {
      setConfirmacao({ mensagem, simTexto, naoTexto, resolve });
    });
  }

  function responderConfirmacao(valor) {
    confirmacao?.resolve(valor);
    setConfirmacao(null);
  }

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, showError, confirm }}>
      {children}
      {loading && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-superficie p-8 text-center shadow-2xl">
            <div className={`mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-borda-suave ${loading.erro ? "border-t-erro" : "border-t-acento"}`} />
            <h2 className="text-xl font-bold text-texto">{loading.texto}</h2>
            {loading.subtexto && <p className="mt-2 whitespace-pre-line text-sm text-texto-secundario">{loading.subtexto}</p>}
            {loading.erro && <button type="button" onClick={stopLoading} className="mt-5 rounded-lg bg-marca px-5 py-2 font-bold text-sobre-marca">Fechar</button>}
          </div>
        </div>
      )}
      {confirmacao && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-superficie p-7 shadow-2xl">
            <p className="text-lg font-semibold text-texto-forte">{confirmacao.mensagem}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => responderConfirmacao(false)} className="rounded-lg border border-borda px-4 py-2 font-bold"> {confirmacao.naoTexto} </button>
              <button type="button" onClick={() => responderConfirmacao(true)} className="rounded-lg bg-marca px-4 py-2 font-bold text-sobre-marca"> {confirmacao.simTexto} </button>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const contexto = useContext(LoadingContext);
  if (!contexto) throw new Error("useLoading deve ser usado dentro de um LoadingProvider");
  return contexto;
}
