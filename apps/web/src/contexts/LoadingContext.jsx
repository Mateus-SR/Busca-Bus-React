"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import LoadingModal from "@/components/ui/LoadingModal";

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const loadingToken = useRef(0);

  const startLoading = useCallback((texto = "Carregando...", subtexto = "") => {
    const token = ++loadingToken.current;
    setLoading({ texto, subtexto, erro: false, token });
    return token;
  }, []);

  const stopLoading = useCallback((token) => {
    setLoading((atual) => {
      if (token && atual?.token !== token) return atual;
      return null;
    });
  }, []);

  const showError = useCallback((texto, subtexto = "", detalheTecnico = "") => {
    setLoading({ texto, subtexto, detalheTecnico, erro: true });
  }, []);

  const confirm = useCallback((opcoes = {}) => {
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
  }, []);

  const responderConfirmacao = useCallback((valor) => {
    confirmacao?.resolve(valor);
    setConfirmacao(null);
  }, [confirmacao]);

  const contexto = useMemo(
    () => ({ startLoading, stopLoading, showError, confirm }),
    [confirm, showError, startLoading, stopLoading],
  );

  return (
    <LoadingContext.Provider value={contexto}>
      {children}
      <LoadingModal
        loading={loading}
        confirmacao={confirmacao}
        onClose={stopLoading}
        onConfirm={responderConfirmacao}
      />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const contexto = useContext(LoadingContext);
  if (!contexto) throw new Error("useLoading deve ser usado dentro de um LoadingProvider");
  return contexto;
}
