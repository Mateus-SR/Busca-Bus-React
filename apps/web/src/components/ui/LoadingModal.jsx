"use client";

import { useEffect, useRef, useState } from "react";

const BUS_IMAGE = "/img/bus-svgrepo-com-256.png";
const CLOUD_IMAGE = "/img/cloud-svgrepo-com-1-256.png";

function numeroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function NuvensAnimadas({ ativa }) {
  const [nuvens, setNuvens] = useState([]);
  const proximoId = useRef(0);
  const temporizador = useRef(null);

  useEffect(() => {
    let pausada = false;

    if (!ativa) {
      if (temporizador.current) window.clearTimeout(temporizador.current);
      temporizador.current = null;
      setNuvens([]);
      return undefined;
    }

    function criarNuvem() {
      if (pausada || document.visibilityState !== "visible" || !document.hasFocus()) return;
      const id = proximoId.current;
      proximoId.current += 1;
      setNuvens((atuais) => [
        ...atuais,
        {
          id,
          tamanho: numeroAleatorio(50, 75),
          inferior: numeroAleatorio(60, 75),
          duracao: numeroAleatorio(2500, 3000),
        },
      ]);
      temporizador.current = window.setTimeout(criarNuvem, 2500);
    }

    function pausar() {
      pausada = true;
      if (temporizador.current) window.clearTimeout(temporizador.current);
      temporizador.current = null;
      setNuvens([]);
    }

    function retomar() {
      pausada = false;
      if (!temporizador.current) criarNuvem();
    }

    function quandoVisibilidadeMudar() {
      if (document.visibilityState === "hidden") {
        pausar();
        return;
      }

      if (document.hasFocus()) retomar();
    }

    if (document.visibilityState === "visible" && document.hasFocus()) criarNuvem();
    document.addEventListener("visibilitychange", quandoVisibilidadeMudar);
    window.addEventListener("blur", pausar);
    window.addEventListener("focus", retomar);
    return () => {
      pausada = true;
      if (temporizador.current) window.clearTimeout(temporizador.current);
      temporizador.current = null;
      document.removeEventListener("visibilitychange", quandoVisibilidadeMudar);
      window.removeEventListener("blur", pausar);
      window.removeEventListener("focus", retomar);
    };
  }, [ativa]);

  function removerNuvem(id) {
    setNuvens((atuais) => atuais.filter((nuvem) => nuvem.id !== id));
  }

  return nuvens.map((nuvem) => (
    <img
      key={nuvem.id}
      src={CLOUD_IMAGE}
      alt=""
      aria-hidden="true"
      className="absolute left-full z-0 animate-fullRightLeft"
      style={{
        width: `${nuvem.tamanho}px`,
        bottom: `${nuvem.inferior}%`,
        animation: `fullRightLeft ${nuvem.duracao}ms linear`,
      }}
      onAnimationEnd={() => removerNuvem(nuvem.id)}
    />
  ));
}

export default function LoadingModal({
  loading,
  confirmacao,
  onClose,
  onConfirm,
}) {
  const [fechando, setFechando] = useState(false);
  const [tempoExcedido, setTempoExcedido] = useState(false);
  const estadoErro = Boolean(loading?.erro);
  const aberto = Boolean(loading || confirmacao);
  const precisaCrescer = Boolean(tempoExcedido || confirmacao);

  useEffect(() => {
    if (aberto) setFechando(false);
  }, [aberto]);

  useEffect(() => {
    setTempoExcedido(false);
    if (!loading || loading.erro || confirmacao) return undefined;
    const temporizador = window.setTimeout(() => setTempoExcedido(true), 80_000);
    return () => window.clearTimeout(temporizador);
  }, [loading, confirmacao]);

  useEffect(() => {
    if (!aberto) return undefined;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto]);

  if (!aberto) return null;

  const texto = confirmacao?.mensagem || loading?.texto || "Carregando...";
  const subtexto = loading?.subtexto || (!confirmacao ? "Por favor, aguarde." : "");

  function fechar() {
    setFechando(true);
  }

  function concluirFechamento() {
    if (!fechando) return;
    setFechando(false);
    onClose();
  }

  return (
    <div
      className="fixed top-0 left-0 z-[800] flex h-full w-full items-center justify-center overflow-hidden bg-black/20 font-roboto-mono backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-status"
    >
      <div
        className={`relative flex min-h-[22rem] w-[calc(100%-2rem)] max-w-md flex-col items-center justify-center overflow-hidden rounded-xl border border-borda-forte bg-superficie p-6 shadow-2xl shadow-black/60 sm:py-10 ${!precisaCrescer ? "sm:aspect-square" : "sm:min-h-[22rem]"} ${fechando ? "animate-shrink" : ""}`}
        onAnimationEnd={concluirFechamento}
      >
        <div className="relative flex h-36 w-full shrink-0 items-center justify-center">
          <NuvensAnimadas ativa={!estadoErro && !fechando} />
          <img
            src={BUS_IMAGE}
            alt=""
            aria-hidden="true"
            className={`z-10 size-24 shrink-0 ${!estadoErro && !fechando ? "animate-busJiggle" : ""}`}
          />
        </div>
        <div className="z-10 flex w-full flex-col items-center text-center">
          <p
            id="loading-status"
            aria-live={estadoErro ? "assertive" : "polite"}
            className={`mx-5 text-2xl font-extrabold text-texto ${!estadoErro && !fechando ? "animate-pulse" : ""}`}
          >
            {texto}
          </p>
          {subtexto && (
            <p className="mx-10 text-base font-bold italic text-texto-secundario">
              {subtexto}
            </p>
          )}
          {loading?.detalheTecnico && (
            <details className="mx-8 mt-4 max-w-full text-left text-xs text-texto-secundario">
              <summary className="cursor-pointer font-bold">Detalhes técnicos</summary>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded border border-borda-suave bg-superficie-alt p-2">
                {loading.detalheTecnico}
              </pre>
            </details>
          )}
          {confirmacao && (
            <div className="m-2 flex flex-row flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => onConfirm(false)}
              className="cursor-pointer rounded-2xl border-2 border-acento px-8 py-4 text-lg font-bold text-texto shadow-lg transition-all duration-200 ease-out hover:border-borda-forte hover:bg-acento hover:text-sobre-marca focus:ring-2 focus:ring-foco focus:outline-none"
            >
              {confirmacao.naoTexto}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(true)}
              className="cursor-pointer rounded-2xl border-2 border-acento px-8 py-4 text-lg font-bold text-texto shadow-lg transition-all duration-200 ease-out hover:border-borda-forte hover:bg-acento hover:text-sobre-marca focus:ring-2 focus:ring-foco focus:outline-none"
            >
              {confirmacao.simTexto}
            </button>
            </div>
          )}
          {tempoExcedido && loading && !loading.erro && !confirmacao && (
            <div className="mt-5 flex flex-col items-center px-4 text-center">
              <p className="text-sm font-semibold text-texto-secundario">
                Isso está demorando mais do que o esperado... Por favor, recarregue a página e tente novamente.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 cursor-pointer rounded-xl bg-destaque px-5 py-3 text-base font-semibold text-sobre-destaque shadow-lg transition hover:bg-destaque-forte focus:ring-2 focus:ring-foco focus:outline-none"
              >
                Recarregar página
              </button>
            </div>
          )}
        </div>
        {loading?.erro && (
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar mensagem"
            className="absolute top-[5%] right-[5%] z-[1000] text-2xl text-texto transition-all duration-300 ease-out hover:text-acento"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
