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
  { href: "/sobre", label: "Sobre" },
];

export default function Header() {
  const { estaLogado, carregando } = useAuth();

  return (
    <header className="bg-sptrans text-white">
      <div className="mx-auto grid w-full max-w-300 grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 sm:px-4 md:grid-cols-[1fr_2fr_1fr]">
        
        {/* Logo */}
        <Link href="/" className="text-sm font-extrabold leading-tight tracking-[0.2px] sm:text-base" aria-label="Página inicial Busca Bus">
          Busca Bus
          <br/> Monitoramento
        </Link>

        {/* Navegação principal */}
        <nav aria-label="Navegação principal" className="hidden md:flex justify-self-center gap-3.5">
          {LINKS_NAV.map((link) => (
            <Link key={link.href} href={link.href} className="font-semibold text-base py-2.5 px-3 rounded-lg opacity-90 hover:opacity-100 transition-all duration-200 ease-out">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Ações à direita */}
        <div className="justify-self-end flex items-center gap-2.5">
          
          {/* Autenticação ou Menu do Usuário */}
          {carregando ? null : !estaLogado ? (
            <div className="hidden md:flex gap-2.5 items-center">
              <Link href="/login" className="border-white border-[3px] font-bold rounded-xl px-3.5 py-2 bg-white text-black hover:bg-white/80 transition-all duration-200 ease-out">
                Entrar
              </Link>
              <Link href="/cadastro" className="font-bold rounded-xl px-3.5 py-2 border-white border-[3px] text-white hover:bg-white/50 transition-all duration-200 ease-out">
                Criar conta
              </Link>
            </div>
          ) : (
            <UserMenu />
          )}

          {/* Gaveta de Acessibilidade posicionada logo após o fluxo de login/conta */}
          <AccessibilityDrawer />
          
          <MobileNavbar links={LINKS_NAV} />
        </div>
      </div>
    </header>
  );
}