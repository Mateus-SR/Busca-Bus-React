"use client";

import Link from "next/link";
import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { criarClienteApi } from "@busca-bus/core/cliente";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmarFavoritoModal from "@/components/listas/ConfirmarFavoritoModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ExibicoesTable({ modo }) {
  const { accessToken, estaLogado, carregando } = useAuth();
  const [itens, setItens] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (carregando) return;
    if (!estaLogado || !API_URL || !accessToken) {
      setErro(!API_URL ? "Esta lista exige conexão com o servidor." : "Faça login para carregar suas exibições.");
      setCarregandoDados(false);
      return;
    }
    let cancelado = false;
    setCarregandoDados(true);
    const cliente = criarClienteApi(API_URL);
    const carregar = modo === "favoritos"
      ? cliente.listarFavoritos(accessToken).then((resposta) => resposta.favoritos)
      : cliente.obterExibicoesUsuario(accessToken).then((resposta) => resposta.exibicoes);
    carregar
      .then((resposta) => {
        if (!cancelado) setItens(Array.isArray(resposta) ? resposta : []);
      })
      .catch((error) => {
        if (!cancelado) {
          setErro(error.message || `Não foi possível carregar ${modo === "favoritos" ? "os favoritos" : "suas exibições"}.`);
        }
      })
      .finally(() => {
        if (!cancelado) setCarregandoDados(false);
      });
    return () => {
      cancelado = true;
    };
  }, [accessToken, carregando, estaLogado, modo]);

  if (carregando || carregandoDados) return <p className="py-8 text-center text-texto-secundario">Carregando exibições...</p>;
  if (!estaLogado) return <div className="py-6 text-center text-texto-mudo">Faça login para ver suas linhas</div>;
  if (erro) return <p className="py-8 text-center text-erro-forte">{erro}</p>;

  const vazio = modo === "favoritos" ? "Você ainda não favoritou nenhuma linha 😢" : "Você ainda não criou nenhuma exibição 📂";

  async function remover(item) {
    if (modo === "favoritos") {
      setModal({ tipo: "remocao", item });
      return;
    }
    setModal({ tipo: "exclusao", item });
  }

  async function removerConfirmado(item) {
    const codigo = item.codigo || item.codigo_exib;
    if (modo === "favoritos") {
      try {
        await criarClienteApi(API_URL).desfavoritar(codigo, accessToken);
      } catch (error) {
        setErro(error.message || "Não foi possível remover o favorito.");
        return;
      }
    } else {
      try {
        await criarClienteApi(API_URL).excluirExibicao(codigo, accessToken);
      } catch (error) {
        setErro(error.message || "Não foi possível apagar a exibição.");
        return;
      }
    }
    setItens((atuais) => atuais.filter((atual) => (atual.codigo || atual.codigo_exib) !== codigo));
    setModal(null);
  }

  function acessar(item) {
    setModal({ tipo: "acesso", item });
  }

  function confirmarAcesso() {
    const codigo = modal.item.codigo || modal.item.codigo_exib;
    window.location.assign(`/exibicao?codigo=${encodeURIComponent(codigo)}`);
  }

  return <><table className="min-w-full table-auto border-collapse"><thead><tr className="bg-superficie-alt font-bold text-texto-suave"><th className="w-1/4 px-6 py-3 text-center">Código</th><th className="w-2/4 px-6 py-3 text-center">Nome da exibição</th><th className="w-1/4 px-6 py-3 text-center">Ações</th></tr></thead><tbody>{itens.length ? itens.map((item) => { const codigo = item.codigo || item.codigo_exib; const nome = item.nome || item.nome_exibicao; const linha = { ...item, codigo, nome }; return <tr key={codigo} className="border-b transition hover:bg-superficie-alt"><td className="px-6 py-3 text-center text-lg font-bold hover:text-acento"><button type="button" onClick={() => acessar(linha)} className="cursor-pointer">{codigo}</button></td><td className="px-6 py-3 text-center font-medium text-texto-suave"><button type="button" onClick={() => acessar(linha)} className="cursor-pointer hover:text-acento">{nome || "Sem Nome"}</button></td><td className="px-6 py-3 text-center"><div className="flex justify-center gap-4">{modo === "criadas" ? <><Link href={`/configuracao?editar=${encodeURIComponent(codigo)}`} className="p-2 text-info transition hover:scale-110 hover:text-info-forte" title="Editar"><Pencil /></Link><button type="button" onClick={() => remover(item)} className="p-2 text-erro transition hover:scale-110 hover:text-erro-intenso" title="Apagar"><Trash2 /></button></> : <button type="button" onClick={() => remover(item)} className="p-2 text-texto-desabilitado transition hover:text-erro-suave" title="Remover favorito"><X /></button>}</div></td></tr>; }) : <tr><td colSpan="3" className="py-8 text-center text-lg text-texto-secundario">{vazio}</td></tr>}</tbody></table><ConfirmarFavoritoModal tipo={modal?.tipo} item={modal?.item} onClose={() => setModal(null)} onConfirm={modal?.tipo === "acesso" ? confirmarAcesso : () => removerConfirmado(modal.item)} /></>;
}
