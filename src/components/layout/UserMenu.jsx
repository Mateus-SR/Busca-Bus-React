"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CircleUser, ChevronDown } from "lucide-react";

export default function UserMenu() {
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickFora(evento) {
      if (menuRef.current && !menuRef.current.contains(evento.target)) {
        setDropdownAberto(false);
      }
    }

    document.addEventListener("click", handleClickFora);

    return () => {
      document.removeEventListener("click", handleClickFora);
    };
  }, []);

  return (
    <div className="md:flex relative hidden" ref={menuRef}>
      <button
        type="button"
        onClick={() => setDropdownAberto((valorAtual) => !valorAtual)}
        aria-expanded={dropdownAberto}
        className="px-2 py-2 border-white border-[3px] text-white hover:bg-white/50 transition-all duration-200 ease-out flex items-center gap-2 rounded-xl cursor-pointer"
      >
        <CircleUser className="size-6" />
        <span className="font-semibold">Olá, Visitante!</span>
        <ChevronDown />
      </button>

      {dropdownAberto && (
        <ul className="absolute right-0 mt-12 w-44 bg-white border border-gray-300 rounded-xl shadow-lg text-left z-50">
          <li>
            <Link href="/minhas-exibicoes" className="block px-4 py-2 rounded-t-xl hover:bg-gray-100 text-black">
              Minhas exibições
            </Link>
          </li>
          <li>
            <Link href="/favoritos" className="block px-4 py-2 hover:bg-gray-100 text-black">
              Meus favoritos
            </Link>
          </li>
          <li>
            <Link href="/configuracao" className="block px-4 py-2 hover:bg-gray-100 text-black">
              Criar exibição
            </Link>
          </li>
          <li>
            <button type="button" className="w-full text-left px-4 py-2 rounded-b-xl hover:bg-gray-100 text-black cursor-pointer">
              Sair da conta
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}