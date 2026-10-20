export default function SobrePage() {
	return (
		<main className="relative min-h-screen bg-[url(/img/Onibus2.png)] bg-cover bg-center">
			<div className="absolute inset-0 bg-black/40" />
			<div className="relative flex min-h-screen items-center justify-center bg-gray-100/90 p-4">
				<article className="w-full max-w-4xl rounded-xl border border-gray-300 bg-white p-6 shadow-2xl sm:p-10">
					<h1 className="mb-6 text-center text-3xl font-extrabold text-black">
						Sobre o projeto
					</h1>
					<div className="text-justify text-sm break-words text-gray-700">
						<p className="mb-4">
							O Busca Bus surgiu como uma proposta para o Projeto Interdisciplinar
							(PI) da FATEC Zona Leste, a partir de ideias apresentadas em uma feira
							de projetos. Durante esse processo, identificamos uma necessidade
							presente na rotina de muitos estudantes: ter acesso a informações que
							facilitassem o deslocamento até a faculdade, especialmente em relação
							ao transporte público. Dessa necessidade nasceu a proposta de
							desenvolver uma plataforma de monitoramento de ônibus voltada à
							comunidade acadêmica da região.
						</p>
						<p className="mb-4">
							O desenvolvimento do projeto teve como referência a pesquisa sobre {' '}
							<a
								className="text-sptrans hover:text-red-800"
								href="https://pos.cps.sp.gov.br/dissertacoes-pos/propostas-de-melhoria-de-mobilidade-para-o-deslocamento-de-estudantes-de-uma-ies-de-tecnologia/"
							>
								propostas de melhoria da mobilidade para o
								deslocamento de estudantes de uma instituição de ensino superior de
								tecnologia
							</a>
							, de Edson Company, coordenador do nosso curso. Para viabilizar suas
							funcionalidades, o Busca Bus utiliza a{' '}
							<a
								className="text-sptrans hover:text-red-800"
								href="https://www.sptrans.com.br/desenvolvedores/api-do-olho-vivo-guia-de-referencia"
							>
								API Olho Vivo
							</a>
							, disponibilizada pela SPTrans, que fornece informações relacionadas ao transporte público por ônibus
							nas cidade de São Paulo.
						</p>
						<p>
							Ao longo de sua trajetória, o projeto passou por mudanças em sua
							composição e continuou evoluindo. Atualmente, a equipe é formada por
							cinco integrantes: João Pedro, Mateus S. Rodrigues, Pedro Henrique
							Matos, Rebeca Gomes e Laura Valentim. Juntos, buscamos aprimorar a
							plataforma e contribuir para uma experiência de deslocamento mais
							prática, informada e acessível para os estudantes da FATEC Zona
							Leste.
						</p>
					</div>
				</article>
			</div>
		</main>
	);
}
