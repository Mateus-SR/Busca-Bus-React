"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  CircleUser,
  ChevronDown,
  LayoutGrid,
  Star,
  PenLine,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmLogoutModal from "@/components/ui/ConfirmLogoutModal";

export default function UserMenu() {
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [modalLogoutAberto, setModalLogoutAberto] = useState(false);
  const menuRef = useRef(null);
  const { usuario, logout } = useAuth();

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
        className={`
          px-3 py-2
          border-white border-[3px]
          text-white
          transition-all duration-200 ease-out
          flex items-center gap-2
          rounded-xl
          cursor-pointer
          hover:bg-white/20
          ${dropdownAberto ? "bg-white/20" : ""}
        `}
      >
        <CircleUser className="size-6" />

        <span className="font-semibold">
          Olá, {usuario?.nome ?? "Visitante"}!
        </span>

        <ChevronDown
          className={`size-5 transition-transform duration-200 ${
            dropdownAberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {dropdownAberto && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg z-50">
          <div className="p-2">
            <Link
              href="/minhas-exibicoes"
              onClick={() => setDropdownAberto(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-gray-700 transition-all duration-200 hover:bg-gray-100"
            >
              <LayoutGrid className="size-5 text-gray-600" />
              <span className="text-sm font-semibold">
                Minhas exibições
              </span>
            </Link>

            <Link
              href="/favoritos"
              onClick={() => setDropdownAberto(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-gray-700 transition-all duration-200 hover:bg-gray-100"
            >
              <Star className="size-5 text-gray-600" />
              <span className="text-sm font-semibold">
                Meus favoritos
              </span>
            </Link>

            <Link
              href="/configuracao"
              onClick={() => setDropdownAberto(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-gray-700 transition-all duration-200 hover:bg-gray-100"
            >
              <PenLine className="size-5 text-gray-600" />
              <span className="text-sm font-semibold">
                Criar exibição
              </span>
            </Link>
          </div>

          <div className="border-t border-gray-200 p-2">
            <button
              type="button"
              onClick={() => {
                setDropdownAberto(false);
                setModalLogoutAberto(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-gray-700 transition-all duration-200 hover:bg-gray-100 cursor-pointer"
            >
              <LogOut className="size-5 text-gray-600" />

              <span className="text-sm font-semibold">
                Sair da conta
              </span>
            </button>
          </div>
        </div>
      )}

      <ConfirmLogoutModal
        aberto={modalLogoutAberto}
        onClose={() => setModalLogoutAberto(false)}
        onConfirm={() => {
          setModalLogoutAberto(false);
          logout();
        }}
      />
    </div>
  );
}