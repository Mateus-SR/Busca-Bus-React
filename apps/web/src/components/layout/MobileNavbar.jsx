"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function MobileNavbar({ links }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        className="z-[60] cursor-pointer p-1 md:hidden"
      >
        {aberto ? <X /> : <Menu />}
      </button>

      {aberto && (
        <button
          type="button"
          aria-label="Fechar menu de navegação"
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}
      <nav
        aria-label="Navegação mobile"
        className={`fixed top-0 right-0 z-50 flex h-dvh w-[min(80vw,20rem)] flex-col items-center justify-center gap-7 bg-sptrans px-6 transition-transform duration-300 md:hidden ${
          aberto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setAberto(false)}
            className="rounded-lg px-4 py-3 text-center text-xl font-bold text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}