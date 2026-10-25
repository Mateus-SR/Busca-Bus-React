"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import ConfirmLogoutModal from "@/components/ui/ConfirmLogoutModal";

export default function MobileNavbar({ links, onLogout }) {
  const [aberto, setAberto] = useState(false);
  const [modalLogoutAberto, setModalLogoutAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        className={`relative z-[1300] cursor-pointer rounded-lg border border-white/30 bg-white/10 p-2 text-white transition hover:bg-white/20 md:hidden ${
          aberto ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <Menu size={22} />
      </button>

      {aberto && (
        <button
          type="button"
          aria-label="Fechar menu de navegação"
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-[1100] bg-black/50 md:hidden"
        />
      )}
      {/*
        O painel fica fora da tela quando fechado. Um elemento `fixed` fora da tela alarga o layout viewport nos
        navegadores de celular (a página aparece encolhida e arrastável); `overflow-x: hidden` no body não evita isso.
        Por isso o painel é `absolute` dentro de um recorte `fixed` do tamanho da tela: o que sai dele é cortado e
        não conta como largura da página. `invisible` tira o menu fechado da ordem de tabulação e do leitor de tela.
      */}
      <div className="recorte-gaveta pointer-events-none fixed inset-x-0 top-0 z-[1200] h-dvh overflow-hidden md:hidden">
      <nav
        aria-label="Navegação mobile"
        className={`pointer-events-auto absolute top-0 right-0 flex h-full w-[min(80vw,20rem)] flex-col justify-start bg-sptrans px-5 py-8 text-white shadow-2xl transition-[transform,visibility] duration-300 ${
          aberto ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between border-b border-white/20 pb-4">
          <span className="text-lg font-extrabold tracking-wide">Menu</span>
          <button
            type="button"
            aria-label="Fechar menu de navegação"
            onClick={() => setAberto(false)}
            className="rounded-full border border-white/30 p-2 text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {links.map((grupo) => (
            <div key={grupo.grupo} className="space-y-2">
              {grupo.grupo === "conta" && (
                <div className="mb-1 border-b border-white/20 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
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
                      className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left text-base font-bold text-white transition hover:bg-white/20"
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
                    className="block w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-white transition hover:bg-white/10 hover:shadow-inner"
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