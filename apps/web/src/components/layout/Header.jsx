"use client";

import Link from "next/link";
import UserMenu from "./UserMenu";
import MobileNavbar from "./MobileNavbar";
import AccessibilityDrawer from "./AccessibilityDrawer";
import { useAuth } from "@/contexts/AuthContext";

const LINKS_NAV = [
  { href: "/", label: "Início" },
  { href: "/mapa", label: "Acessar Mapa" },
  { href: "/exibicao", label: "Acessar Exibição" },
  { href: "/calendario", label: "Calendário" },
  { href: "/sobre", label: "Sobre" },
];

const LINKS_USUARIO = [
  { href: "/minhas-exibicoes", label: "Minhas Exibições" },
  { href: "/favoritos", label: "Meus Favoritos" },
  { href: "/configuracao", label: "Criar Exibição" },
];

export default function Header() {
  const { estaLogado, carregando, logout } = useAuth();

  const linksMobile = [
    { grupo: "publico", itens: LINKS_NAV },
    {
      grupo: "conta",
      itens: estaLogado
        ? LINKS_USUARIO.concat([{ href: "#logout", label: "Sair da Conta", action: "logout" }])
        : [
            { href: "/login", label: "Entrar" },
            { href: "/cadastro", label: "Criar conta" },
          ],
    },
  ];

  return (
    <header className="relative z-[1200] bg-sptrans text-white">
      <div className="mx-auto grid w-full max-w-300 grid-cols-[auto_1fr_auto] items-center gap-4 px-3 py-2.5 sm:px-5 md:grid-cols-[minmax(160px,1fr)_auto_minmax(220px,1fr)] md:gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="justify-self-start text-sm font-extrabold leading-tight tracking-[0.2px] sm:text-base"
          aria-label="Página inicial Busca Bus"
        >
          Busca Bus
          <br /> Monitoramento
        </Link>

        {/* Navegação principal */}
        <nav
          aria-label="Navegação principal"
          className="hidden items-center justify-self-center gap-1 md:flex lg:gap-2"
        >
          {LINKS_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2.5 py-2.5 text-center text-sm font-semibold whitespace-nowrap opacity-90 transition-all duration-200 ease-out hover:bg-white/10 hover:opacity-100 lg:px-3 lg:text-base"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Ações à direita */}
        <div className="flex items-center justify-self-end gap-2">
          {/* Autenticação ou Menu do Usuário */}
          {carregando ? null : !estaLogado ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-xl border-[3px] border-white bg-white px-3 py-2 text-sm font-bold text-black transition-all duration-200 ease-out hover:bg-white/80 lg:px-3.5 lg:text-base"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-xl border-[3px] border-white px-3 py-2 text-sm font-bold text-white transition-all duration-200 ease-out hover:bg-white/50 lg:px-3.5 lg:text-base"
              >
                Criar conta
              </Link>
            </div>
          ) : (
            <UserMenu />
          )}

          <AccessibilityDrawer />

          <MobileNavbar links={linksMobile} onLogout={logout} />
        </div>
      </div>
    </header>
  );
}