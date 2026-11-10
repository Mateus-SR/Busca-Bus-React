"use client";

import Link from "next/link";
import { CalendarDays, ChevronDown, CirclePlus, Filter, MapPin, Pencil, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { criarClienteApi } from "@busca-bus/core/cliente";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmarFavoritoModal from "@/components/listas/ConfirmarFavoritoModal";
import FavoriteStar from "@/components/exibicao/FavoriteStar";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ITENS_POR_PAGINA = 6;

function normalizarItem(item) {
  return {
    ...item,
    codigo: item.codigo || item.codigo_exib || "",
    nome: item.nome || item.nome_exibicao || "Sem nome",
    instituicao: item.instituicao || item.instituicaoNome || item.instituicaoId || "Não informada",
    paradas: Array.isArray(item.paradas) ? item.paradas : [],
  };
}

function formatarData(data) {
  if (!data) return "Sem atualização";
  const dataFormatada = new Date(data);
  if (Number.isNaN(dataFormatada.getTime())) return "Sem atualização";
  return dataFormatada.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ExibicoesTable({ modo }) {
  const { accessToken, estaLogado, carregando } = useAuth();
  const [itens, setItens] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState("");
  const [instituicaoSelecionada, setInstituicaoSelecionada] = useState("");
  const [dropdownInstituicaoAberto, setDropdownInstituicaoAberto] = useState(false);
  const dropdownInstituicaoRef = useRef(null);
  const [quantidadeVisivel, setQuantidadeVisivel] = useState(ITENS_POR_PAGINA);

  useEffect(() => {
    if (carregando) return;
    if (!estaLogado || !API_URL || !accessToken) {
      setErro(!API_URL ? "Esta lista exige conexão com o servidor." : "Faça login para carregar suas exibições.");
      setCarregandoDados(false);
      return;
    }
    let cancelado = false;
    setCarregandoDados(true);
    setErro("");
    const cliente = criarClienteApi(API_URL);
    const carregar = modo === "favoritos"
      ? cliente.listarFavoritos(accessToken).then((resposta) => resposta.favoritos)
      : cliente.obterExibicoesUsuario(accessToken).then((resposta) => resposta.exibicoes);
    carregar
      .then((resposta) => {
        if (!cancelado) {
          setItens(Array.isArray(resposta) ? resposta.map(normalizarItem) : []);
          setQuantidadeVisivel(ITENS_POR_PAGINA);
          setInstituicaoSelecionada("");
        }
      })
      .catch((error) => {
        if (!cancelado) setErro(error.message || `Não foi possível carregar ${modo === "favoritos" ? "os favoritos" : "suas exibições"}.`);
      })
      .finally(() => {
        if (!cancelado) setCarregandoDados(false);
      });
    return () => {
      cancelado = true;
    };
  }, [accessToken, carregando, estaLogado, modo]);

  useEffect(() => {
    function fecharAoClicarFora(evento) {
      if (dropdownInstituicaoRef.current && !dropdownInstituicaoRef.current.contains(evento.target)) {
        setDropdownInstituicaoAberto(false);
      }
    }
    document.addEventListener("click", fecharAoClicarFora);
    return () => document.removeEventListener("click", fecharAoClicarFora);
  }, []);

  const instituicoes = useMemo(() => (
    [...new Set(itens.map((item) => item.instituicao).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b), "pt-BR"))
  ), [itens]);
  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return itens.filter((item) => {
      const correspondeNome = !termo || item.nome.toLocaleLowerCase("pt-BR").includes(termo);
      const correspondeInstituicao = !instituicaoSelecionada || item.instituicao === instituicaoSelecionada;
      return correspondeNome && correspondeInstituicao;
    });
  }, [busca, instituicaoSelecionada, itens]);
  const itensVisiveis = itensFiltrados.slice(0, quantidadeVisivel);
  const podeCarregarMais = quantidadeVisivel < itensFiltrados.length;
  const titulo = modo === "favoritos" ? "Exibições favoritas" : "Minhas exibições";
  const descricao = modo === "favoritos"
    ? "Acesse rapidamente as exibições que você salvou."
    : "Gerencie as exibições criadas por você.";
  const vazio = modo === "favoritos" ? "Você ainda não favoritou nenhuma exibição." : "Você ainda não criou nenhuma exibição.";

  async function removerConfirmado(item) {
    try {
      if (modo === "favoritos") await criarClienteApi(API_URL).desfavoritar(item.codigo, accessToken);
      else await criarClienteApi(API_URL).excluirExibicao(item.codigo, accessToken);
      setItens((atuais) => atuais.filter((atual) => atual.codigo !== item.codigo));
      setModal(null);
    } catch (error) {
      setErro(error.message || `Não foi possível ${modo === "favoritos" ? "remover o favorito" : "apagar a exibição"}.`);
    }
  }

  function abrirRemocao(item) {
    setModal({ tipo: modo === "favoritos" ? "remocao" : "exclusao", item });
  }

  function confirmarAcesso() {
    window.location.assign(`/exibicao?codigo=${encodeURIComponent(modal.item.codigo)}`);
  }

  if (carregando || carregandoDados) return <p className="py-12 text-center text-texto-secundario">Carregando exibições...</p>;
  if (!estaLogado) return <div className="py-8 text-center text-texto-mudo">Faça login para ver suas exibições.</div>;
  if (erro) return <p className="py-8 text-center text-erro-forte">{erro}</p>;

  return (
    <section aria-labelledby="lista-exibicoes-titulo">
      <header className="mb-6 flex flex-col gap-5 border-b border-borda-suave pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-sobre-marca ${modo === "favoritos" ? "bg-destaque" : "bg-marca"}`}>
              {modo === "favoritos" ? "★" : <CirclePlus size={21} aria-hidden="true" />}
            </span>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-texto-mudo">{itens.length} {itens.length === 1 ? "item" : "itens"}</p>
          </div>
          <h1 id="lista-exibicoes-titulo" className="text-2xl font-extrabold tracking-tight text-texto-forte">{titulo}</h1>
          <p className="mt-1 text-sm text-texto-secundario">{descricao}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-row">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Buscar por nome da exibição</span>
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-mudo" />
            <input value={busca} onChange={(event) => { setBusca(event.target.value); setQuantidadeVisivel(ITENS_POR_PAGINA); }} placeholder="Buscar por nome..." className="w-full rounded-xl border border-borda bg-superficie-sutil py-3 pl-10 pr-4 text-sm text-texto-forte outline-none transition placeholder:text-texto-mudo focus:border-acento focus:ring-2 focus:ring-foco/30" />
          </label>
          <div className="relative block min-w-0 flex-1" ref={dropdownInstituicaoRef}>
            <span className="sr-only" id="filtro-instituicao-label">Filtrar por instituição</span>
            <button type="button" aria-labelledby="filtro-instituicao-label" aria-haspopup="listbox" aria-expanded={dropdownInstituicaoAberto} onClick={() => setDropdownInstituicaoAberto((aberto) => !aberto)} className={`flex w-full items-center gap-3 rounded-xl border border-borda bg-superficie-sutil px-3 py-3 text-left text-sm text-texto-forte outline-none transition hover:bg-superficie-alt focus:border-acento focus:ring-2 focus:ring-foco/30 ${dropdownInstituicaoAberto ? "border-acento bg-superficie-alt" : ""}`}>
              <Filter size={17} aria-hidden="true" className="shrink-0 text-texto-secundario" />
              <span className="min-w-0 flex-1 truncate">{instituicaoSelecionada || "Todas as instituições"}</span>
              <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-texto-secundario transition-transform duration-200 ${dropdownInstituicaoAberto ? "rotate-180" : ""}`} />
            </button>
            {dropdownInstituicaoAberto && (
              <div role="listbox" aria-labelledby="filtro-instituicao-label" className="absolute left-0 right-0 top-full z-50 mt-3 max-h-64 overflow-auto rounded-2xl border border-borda-suave bg-superficie p-2 shadow-lg">
                {["", ...instituicoes].map((instituicao) => {
                  const selecionada = instituicaoSelecionada === instituicao;
                  return (
                    <button
                      key={instituicao || "todas"}
                      type="button"
                      role="option"
                      aria-selected={selecionada}
                      onClick={() => {
                        setInstituicaoSelecionada(instituicao);
                        setQuantidadeVisivel(ITENS_POR_PAGINA);
                        setDropdownInstituicaoAberto(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all duration-200 hover:bg-superficie-alt ${selecionada ? "bg-superficie-alt text-acento" : "text-texto-suave"}`}
                    >
                      {instituicao || "Todas as instituições"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {itensFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borda-forte bg-superficie-sutil px-6 py-12 text-center">
          <p className="font-semibold text-texto-forte">{busca ? "Nenhuma exibição encontrada." : vazio}</p>
          <p className="mt-2 text-sm text-texto-secundario">{busca || instituicaoSelecionada ? "Ajuste o nome ou a instituição selecionada." : "Suas exibições aparecerão aqui."}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {itensVisiveis.map((item) => (
              <article key={item.codigo} className="group rounded-2xl border border-borda-suave bg-superficie p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-borda-forte hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <button type="button" onClick={() => setModal({ tipo: "acesso", item })} className="min-w-0 text-left">
                    <span className="font-roboto-mono text-xs font-bold tracking-wider text-acento">{item.codigo}</span>
                    <h2 className="mt-2 truncate text-lg font-bold text-texto-forte group-hover:text-acento">{item.nome}</h2>
                  </button>
                  <FavoriteStar codigo={item.codigo} />
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="min-w-0"><dt className="text-texto-mudo">Instituição</dt><dd className="mt-1 truncate font-medium text-texto-suave">{item.instituicao}</dd></div>
                  <div><dt className="text-texto-mudo">Paradas</dt><dd className="mt-1 font-medium text-texto-suave">{item.paradas.length}</dd></div>
                </dl>
                <div className="mt-5 flex items-center justify-between border-t border-borda-suave pt-4 text-xs text-texto-mudo">
                  <span className="flex items-center gap-1.5"><CalendarDays size={14} aria-hidden="true" />{formatarData(item.last_update || item.atualizadoEm || item.criadoEm)}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" />{item.paradas.length} {item.paradas.length === 1 ? "ponto" : "pontos"}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setModal({ tipo: "acesso", item })} className="flex-1 rounded-lg bg-marca px-3 py-2 text-sm font-semibold text-sobre-marca transition hover:bg-marca-forte focus:outline-none focus:ring-2 focus:ring-foco/50">Acessar</button>
                  {modo === "criadas" && <Link href={`/configuracao?editar=${encodeURIComponent(item.codigo)}`} className="rounded-lg border border-borda px-3 py-2 text-texto-suave transition hover:border-info hover:text-info focus:outline-none focus:ring-2 focus:ring-foco/50" aria-label={`Editar ${item.nome}`}><Pencil size={17} aria-hidden="true" /></Link>}
                  <button type="button" onClick={() => abrirRemocao(item)} className="rounded-lg border border-borda px-3 py-2 text-texto-suave transition hover:border-erro hover:text-erro focus:outline-none focus:ring-2 focus:ring-foco/50" aria-label={modo === "favoritos" ? `Remover ${item.nome} dos favoritos` : `Apagar ${item.nome}`}><span className="sr-only">{modo === "favoritos" ? "Remover favorito" : "Apagar"}</span>{modo === "favoritos" ? <X size={17} aria-hidden="true" /> : <Trash2 size={17} aria-hidden="true" />}</button>
                </div>
              </article>
            ))}
          </div>
          {podeCarregarMais && <button type="button" onClick={() => setQuantidadeVisivel((quantidade) => quantidade + ITENS_POR_PAGINA)} className="mx-auto mt-6 flex items-center gap-2 rounded-xl border border-borda px-5 py-3 text-sm font-semibold text-texto-suave transition hover:border-acento hover:text-acento focus:outline-none focus:ring-2 focus:ring-foco/50">Carregar mais <ChevronDown size={17} aria-hidden="true" /></button>}
        </>
      )}
      <ConfirmarFavoritoModal tipo={modal?.tipo} item={modal?.item} onClose={() => setModal(null)} onConfirm={modal?.tipo === "acesso" ? confirmarAcesso : () => removerConfirmado(modal.item)} />
    </section>
  );
}
