"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import ConfirmLogoutModal from "@/components/ui/ConfirmLogoutModal";
import useGaveta from "@/hooks/useGaveta";
import useMontado from "@/hooks/useMontado";

export default function MobileNavbar({ links, onLogout }) {
  const [aberto, setAberto] = useState(false);
  const [modalLogoutAberto, setModalLogoutAberto] = useState(false);
  const montado = useMontado();
  const gatilhoRef = useRef(null);
  const painelRef = useRef(null);

  useGaveta({ aberto, aoFechar: () => setAberto(false), painelRef, gatilhoRef });

  // O menu só existe abaixo de `md` (48rem). Se a janela passar disso com ele aberto, fecha: senão a rolagem da
  // página ficaria travada sem nenhum menu visível.
  useEffect(() => {
    const consulta = window.matchMedia("(min-width: 48rem)");
    const aoMudar = (evento) => {
      if (evento.matches) setAberto(false);
    };
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);

  // `fixed` dentro do header não é fixo na tela: o HeaderHider aplica `transform`, e um ancestral com `transform`
  // vira o bloco de referência dos descendentes `fixed`. Por isso o fundo e o painel vão por portal para o <body>.
  const gaveta = (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        data-contraste-ignorar
        onClick={() => setAberto(false)}
        className={`fixed inset-0 z-[1250] bg-black/50 transition-[opacity,visibility] duration-300 ease-in-out motion-reduce:transition-none md:hidden ${
          aberto ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />
      {/*
        O painel fica fora da tela quando fechado. Um elemento `fixed` fora da tela alarga o layout viewport nos
        navegadores de celular (a página aparece encolhida e arrastável); `overflow-x: hidden` no body não evita isso.
        Por isso o painel é `absolute` dentro de um recorte `fixed` do tamanho da tela: o que sai dele é cortado e
        não conta como largura da página. `invisible` tira o menu fechado da ordem de tabulação e do leitor de tela.
        A animação usa `translate` (o Tailwind v4 não usa `transform`), então a transição precisa ser em `translate`.
      */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[1260] h-dvh overflow-hidden md:hidden">
        <nav
          ref={painelRef}
          id="menu-mobile"
          aria-label="Navegação mobile"
          className={`pointer-events-auto absolute top-0 right-0 flex h-full w-[min(80vw,20rem)] flex-col justify-start bg-marca px-5 py-8 text-sobre-marca shadow-2xl transition-[translate,visibility] duration-300 ease-in-out motion-reduce:transition-none ${
            aberto ? "visible translate-x-0" : "invisible translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-center justify-between border-b border-sobre-marca/20 pb-4">
            <span className="text-lg font-extrabold tracking-wide">Menu</span>
            <button
              type="button"
              aria-label="Fechar menu de navegação"
              onClick={() => setAberto(false)}
              className="cursor-pointer rounded-full border border-sobre-marca/30 p-2 text-sobre-marca hover:bg-sobre-marca/10"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            {links.map((grupo) => (
              <div key={grupo.grupo} className="space-y-2">
                {grupo.grupo === "conta" && (
                  <div className="mb-1 border-b border-sobre-marca/20 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sobre-marca/70">
                      Minha conta
                    </span>
                  </div>
                )}

                {grupo.itens.map((link) => {
                  if (link.action === "logout") {
                    return (
                      <button
                        key={link.label}
                        type="button"
                        onClick={() => {
                          setAberto(false);
                          setModalLogoutAberto(true);
                        }}
                        className="mt-1 w-full cursor-pointer rounded-xl border border-sobre-marca/20 bg-sobre-marca/10 px-4 py-3 text-left text-base font-bold text-sobre-marca transition hover:bg-sobre-marca/20"
                      >
                        {link.label}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setAberto(false)}
                      className="block w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-sobre-marca transition hover:bg-sobre-marca/10 hover:shadow-inner"
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>
      </div>
    </>
  );

  return (
    <>
      <button
        ref={gatilhoRef}
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="menu-mobile"
        aria-label={aberto ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        className={`relative z-[1300] cursor-pointer rounded-lg border border-sobre-marca/30 bg-sobre-marca/10 p-2 text-sobre-marca transition hover:bg-sobre-marca/20 md:hidden ${
          aberto ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <Menu size={22} />
      </button>

      {montado && createPortal(gaveta, document.body)}

      <ConfirmLogoutModal
        aberto={modalLogoutAberto}
        onClose={() => setModalLogoutAberto(false)}
        onConfirm={() => {
          setModalLogoutAberto(false);
          onLogout?.();
        }}
      />
    </>
  );
}