"use client";

import Link from "next/link";
import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { EXIBICOES_MOCK } from "@/lib/fixtures/exibicoesFixture";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";

export default function ExibicoesTable({ modo }) {
  const { estaLogado, carregando } = useAuth();
  const { confirm } = useLoading();
  const [itens, setItens] = useState(() => EXIBICOES_MOCK.filter((item) => modo === "favoritos" ? item.favorita : !item.favorita));
  if (carregando) return null;
  if (!estaLogado) return <div className="py-6 text-center text-texto-mudo">Faça login para ver suas linhas</div>;
  const vazio = modo === "favoritos" ? "Você ainda não favoritou nenhuma linha 😢" : "Você ainda não criou nenhuma exibição 📂";

  async function remover(item) {
    const confirmado = await confirm({
      mensagem: `${modo === "favoritos" ? "Remover" : "Apagar"} "${item.nome_exibicao || item.codigo_exib}"?`,
      simTexto: modo === "favoritos" ? "Remover" : "Apagar",
      naoTexto: "Cancelar",
    });
    if (!confirmado) return;
    setItens((atuais) => atuais.filter((atual) => atual.codigo_exib !== item.codigo_exib));
  }

  return <table className="min-w-full table-auto border-collapse"><thead><tr className="bg-superficie-alt font-bold text-texto-suave"><th className="w-1/4 px-6 py-3 text-center">Código</th><th className="w-2/4 px-6 py-3 text-center">Nome da exibição</th><th className="w-1/4 px-6 py-3 text-center">Ações</th></tr></thead><tbody>{itens.length ? itens.map((item) => <tr key={item.codigo_exib} className="border-b transition hover:bg-superficie-alt"><td className="cursor-pointer px-6 py-3 text-center text-lg font-bold hover:text-acento"><Link href={`/exibicao?codigo=${encodeURIComponent(item.codigo_exib)}`}>{item.codigo_exib}</Link></td><td className="cursor-pointer px-6 py-3 text-center font-medium text-texto-suave"><Link href={`/exibicao?codigo=${encodeURIComponent(item.codigo_exib)}`}>{item.nome_exibicao || "Sem Nome"}</Link></td><td className="px-6 py-3 text-center"><div className="flex justify-center gap-4">{modo === "criadas" ? <><Link href={`/configuracao?editar=${encodeURIComponent(item.codigo_exib)}`} className="p-2 text-info transition hover:scale-110 hover:text-info-forte" title="Editar"><Pencil /></Link><button type="button" onClick={() => remover(item)} className="p-2 text-erro transition hover:scale-110 hover:text-erro-intenso" title="Excluir"><Trash2 /></button></> : <button type="button" onClick={() => remover(item)} className="p-2 text-texto-desabilitado transition hover:scale-110 hover:text-erro-suave" title="Remover favorito"><X /></button>}</div></td></tr>) : <tr><td colSpan="3" className="py-8 text-center text-lg text-texto-secundario">{vazio}</td></tr>}</tbody></table>;
}
