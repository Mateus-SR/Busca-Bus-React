import Link from "next/link";
import UserMenu from "./UserMenu";
import MobileNavbar from "./MobileNavbar";

const LINKS_NAV = [
    { href: "/", label: "Início" },
    { href: "/mapa", label: "Acessar Mapa" },
    { href: "/exibicao", label: "Acessar Exibição" },
    { href: "/sobre", label: "Sobre" },
  ];

export default function Header() {
    // Placeholder para testes. Será substituido futuramente por AuthContext.   -Mateus
    const estaLogado = true;

    return (
        <header className="bg-sptrans text-white">
            <div className="max-w-300 w-full mx-auto grid grid-cols-[1fr_2fr_1fr] items-center py-2.5 px-4">
                <Link href="/" className="font-extrabold tracking-[0.2px]" aria-label="Página inicial Busca Bus">
                Busca Bus
                <br/> Monitoramento
                </Link>

            <nav aria-label="Navegação principal" className="hidden md:flex justify-self-center gap-3.5">
                {LINKS_NAV.map((link) => (
                    <Link key={link.href} href={link.href} className="font-semibold text-base py-2.5 px-3 rounded-lg opacity-90 hover:opacity-100 transition-all duration-200 ease-out">
                        {link.label}
                    </Link>
            ))}
            </nav>

                <div className="justify-self-end flex items-center gap-2.5">
                    {!estaLogado ? (
                        <>
                            <Link href="/login" className="border-white border-[3px] font-bold rounded-xl px-3.5 py-2 bg-white text-black hover:bg-white/80 transition-all duration-200 ease-out">
                                Entrar
                            </Link>
                            <Link href="/cadastro" className="font-bold rounded-xl px-3.5 py-2 border-white border-[3px] text-white hover:bg-white/50 transition-all duration-200 ease-out">
                                Criar conta
                            </Link>
                        </>
                    ) : (
                        <>
                            <UserMenu/>
                            <MobileNavbar links={LINKS_NAV} className="z-50"/>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}