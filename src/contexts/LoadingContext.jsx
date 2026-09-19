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

  function confirm(simTexto = "Sim", naoTexto = "Não") {
    return new Promise((resolve) => {
      setConfirmacao({ simTexto, naoTexto, resolve });
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
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className={`mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 ${loading.erro ? "border-t-red-600" : "border-t-sptrans"}`} />
            <h2 className="text-xl font-bold text-black">{loading.texto}</h2>
            {loading.subtexto && <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{loading.subtexto}</p>}
            {loading.erro && <button type="button" onClick={stopLoading} className="mt-5 rounded-lg bg-sptrans px-5 py-2 font-bold text-white">Fechar</button>}
          </div>
        </div>
      )}
      {confirmacao && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <p className="text-lg font-semibold text-gray-900">Tem certeza que deseja continuar?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => responderConfirmacao(false)} className="rounded-lg border border-gray-300 px-4 py-2 font-bold"> {confirmacao.naoTexto} </button>
              <button type="button" onClick={() => responderConfirmacao(true)} className="rounded-lg bg-sptrans px-4 py-2 font-bold text-white"> {confirmacao.simTexto} </button>
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
