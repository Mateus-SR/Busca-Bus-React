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
      <nav
        aria-label="Navegação mobile"
        className={`fixed top-0 right-0 z-[1200] flex h-dvh w-[min(80vw,20rem)] flex-col justify-start bg-sptrans px-5 py-8 text-white shadow-2xl transition-transform duration-300 md:hidden ${
          aberto ? "translate-x-0" : "translate-x-full"
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