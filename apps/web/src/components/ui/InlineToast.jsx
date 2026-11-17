
"use client";

import { createPortal } from "react-dom";
import useMontado from "@/hooks/useMontado";
import { useEffect, useState } from "react";
import { usePainelHeader } from "@/contexts/PainelHeaderContext";

export default function InlineToast({ mensagens = [], mensagem = null }) {
  const montado = useMontado();
  const { headerOculto } = usePainelHeader();

  const mensagemUnica = mensagens.length === 0 && Boolean(mensagem);
  const [saindo, setSaindo] = useState(false);
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    if (!mensagemUnica) return;

    const timeoutSaida = setTimeout(() => {
      setSaindo(true);
    }, 3000);

    const timeoutRemover = setTimeout(() => {
      setVisivel(false);
    }, 3700);

    return () => {
      clearTimeout(timeoutSaida);
      clearTimeout(timeoutRemover);
    };
  }, [mensagemUnica, mensagem?.id]);

  const lista = mensagens.length > 0
    ? mensagens
    : mensagem
      ? [mensagem]
      : [];

  if (!montado || lista.length === 0 || (mensagemUnica && !visivel)) return null;

  const estilosAnimacao = (
    <style>{`
      @keyframes toastEntrada {
        from {
          opacity: 0;
          transform: translateX(110%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes toastSaida {
        from {
          opacity: 1;
          transform: translate(0, 0);
        }
        to {
          opacity: 0;
          transform: translateY(-25px);
        }
      }
    `}</style>
  );

  return createPortal(
    <div
      className={`fixed right-4 z-[1100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 transition-[top] duration-500 ease-in-out sm:right-5 ${headerOculto ? "top-4" : "top-[4.5rem] sm:top-20"
        }`}
    >
      {estilosAnimacao}

      {lista.map((item, index) => (
        <div
          key={item.id ?? index}
          role="status"
          aria-live="polite"
          className={`rounded-xl border border-borda-suave bg-superficie px-4 py-3 text-left text-sm font-semibold text-texto-forte shadow-2xl ${item.cor || ""}`}
          style={{
            animation: (mensagemUnica ? saindo : item.saindo)
              ? "toastSaida 0.7s ease-in forwards"
              : "toastEntrada 0.25s ease-out both",
          }}
        >
          {item.texto}
        </div>
      ))}
    </div>,
    document.body
  );
}
