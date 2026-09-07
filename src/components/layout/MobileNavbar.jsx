"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, CircleUser, ChevronDown } from "lucide-react";

export default function MobileNavbar({ links }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label="Abrir menu de navegação"
        className="md:hidden cursor-pointer z-60"
      >
        {aberto ? <X /> : <Menu />}
      </button>

      <nav
        aria-label="Navegação mobile"
        className={`md:hidden fixed top-0 right-0 h-screen w-64 bg-sptrans flex flex-col items-center justify-center gap-7 z-50 transition-transform duration-300 ${
          aberto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setAberto(false)}
            className="text-white font-bold text-2xl"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}