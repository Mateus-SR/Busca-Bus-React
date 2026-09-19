"use client";

import Link from "next/link";
import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { EXIBICOES_MOCK } from "@/lib/fixtures/exibicoesFixture";
import { useAuth } from "@/contexts/AuthContext";

export default function ExibicoesTable({ modo }) {
  const { estaLogado } = useAuth();
  const [itens, setItens] = useState(() => EXIBICOES_MOCK.filter((item) => modo === "favoritos" ? item.favorita : !item.favorita));
  if (!estaLogado) return <div className="py-6 text-center text-gray-500">Faça login para ver suas linhas</div>;
  const vazio = modo === "favoritos" ? "Você ainda não favoritou nenhuma linha 😢" : "Você ainda não criou nenhuma exibição 📂";

  function remover(item) {
    if (!window.confirm(`${modo === "favoritos" ? "Remover" : "Apagar"} "${item.nome_exibicao || item.codigo_exib}"?`)) return;
    setItens((atuais) => atuais.filter((atual) => atual.codigo_exib !== item.codigo_exib));
  }

  return <table className="min-w-full table-auto border-collapse"><thead><tr className="bg-gray-100 font-bold text-gray-700"><th className="w-1/4 px-6 py-3 text-center">Código</th><th className="w-2/4 px-6 py-3 text-center">Nome da exibição</th><th className="w-1/4 px-6 py-3 text-center">Ações</th></tr></thead><tbody>{itens.length ? itens.map((item) => <tr key={item.codigo_exib} className="border-b transition hover:bg-gray-100"><td className="cursor-pointer px-6 py-3 text-center text-lg font-bold hover:text-sptrans"><Link href={`/exibicao/${item.codigo_exib}`}>{item.codigo_exib}</Link></td><td className="cursor-pointer px-6 py-3 text-center font-medium text-gray-700"><Link href={`/exibicao/${item.codigo_exib}`}>{item.nome_exibicao || "Sem Nome"}</Link></td><td className="px-6 py-3 text-center"><div className="flex justify-center gap-4">{modo === "criadas" ? <><Link href={`/configuracao/${item.codigo_exib}`} className="p-2 text-blue-600 transition hover:scale-110 hover:text-blue-800" title="Editar"><Pencil /></Link><button type="button" onClick={() => remover(item)} className="p-2 text-red-600 transition hover:scale-110 hover:text-red-800" title="Excluir"><Trash2 /></button></> : <button type="button" onClick={() => remover(item)} className="p-2 text-gray-400 transition hover:scale-110 hover:text-red-500" title="Remover favorito"><X /></button>}</div></td></tr>) : <tr><td colSpan="3" className="py-8 text-center text-lg text-gray-600">{vazio}</td></tr>}</tbody></table>;
}
