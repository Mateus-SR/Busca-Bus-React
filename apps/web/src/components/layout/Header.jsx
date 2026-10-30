'use client';

import Link from 'next/link';
import UserMenu from './UserMenu';
import MobileNavbar from './MobileNavbar';
import AccessibilityDrawer from './AccessibilityDrawer';
import { useAuth } from '@/contexts/AuthContext';

const LINKS_NAV = [
	{ href: '/', label: 'Início' },
	{ href: '/mapa', label: 'Acessar Mapa' },
	{ href: '/exibicao', label: 'Acessar Exibição' },
	{ href: '/calendario', label: 'Calendário' },
	{ href: '/sobre', label: 'Sobre' },
];

const LINKS_USUARIO = [
	{ href: '/minhas-exibicoes', label: 'Minhas Exibições' },
	{ href: '/favoritos', label: 'Meus Favoritos' },
	{ href: '/configuracao', label: 'Criar Exibição' },
];

export default function Header() {
	const { estaLogado, carregando, logout } = useAuth();

	const linksMobile = [
		{ grupo: 'publico', itens: LINKS_NAV },
		{
			grupo: 'conta',
			itens: estaLogado
				? LINKS_USUARIO.concat([
						{ href: '#logout', label: 'Sair da Conta', action: 'logout' },
					])
				: [
						{ href: '/login', label: 'Entrar' },
						{ href: '/cadastro', label: 'Criar conta' },
					],
		},
	];

	return (
		<header className="bg-marca relative z-[1200] text-sobre-marca">
			<div className="mx-auto grid w-full max-w-300 grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 sm:px-4 md:grid-cols-[1fr_2fr_1fr]">
				{/* Logo */}
				<Link
					href="/"
					data-contraste-ignorar
					className="text-sm leading-tight font-extrabold tracking-[0.2px] sm:text-base"
					aria-label="Página inicial Busca Bus"
				>
					Busca Bus
					<br /> Monitoramento
				</Link>

				{/* Navegação principal */}
				<nav
					aria-label="Navegação principal"
					className="hidden gap-3.5 justify-self-center md:flex"
				>
					{LINKS_NAV.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="rounded-lg px-1.5 py-2.5 text-[13px] font-semibold opacity-90 transition-all duration-200 ease-out hover:opacity-100 lg:px-3 lg:text-base lg:whitespace-nowrap"
						>
							{link.label}
						</Link>
					))}
				</nav>

				{/* Ações à direita */}
				<div className="flex items-center gap-2.5 justify-self-end">
					{/* Autenticação ou Menu do Usuário */}
					{carregando ? null : !estaLogado ? (
						<div className="hidden items-center gap-2.5 md:flex">
							<Link
								href="/login"
								className="rounded-xl border-[3px] border-sobre-marca bg-superficie px-3.5 py-2 font-bold text-texto transition-all duration-200 ease-out hover:bg-superficie/80"
							>
								Entrar
							</Link>
							<Link
								href="/cadastro"
								className="rounded-xl border-[3px] border-sobre-marca px-3.5 py-2 font-bold text-sobre-marca transition-all duration-200 ease-out hover:bg-sobre-marca/50"
							>
								Criar conta
							</Link>
						</div>
					) : (
						<UserMenu />
					)}

					{/* Gaveta de Acessibilidade posicionada logo após o fluxo de login/conta */}
					<AccessibilityDrawer />

					<MobileNavbar links={linksMobile} onLogout={logout} />
				</div>
			</div>
		</header>
	);
}
