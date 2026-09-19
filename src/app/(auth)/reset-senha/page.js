"use client";

import Link from "next/link";
import { useState } from "react";
import AuthBackground from "@/components/auth/AuthBackground";

export default function ResetSenhaPage() {
  const [senhas, setSenhas] = useState({ nova: "", confirmacao: "" });
  const [mensagem, setMensagem] = useState("");
  function redefinir(evento) {
    evento.preventDefault();
    if (!senhas.nova || !senhas.confirmacao) return setMensagem("Por favor, preencha todos os campos.");
    if (senhas.nova !== senhas.confirmacao) return setMensagem("As senhas não coincidem.");
    if (!/(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(senhas.nova)) return setMensagem("A senha precisa ter letras e números, e no mínimo 6 caracteres.");
    setMensagem("Senha alterada com sucesso! Você já pode entrar.");
  }
  return <AuthBackground largura="max-w-md"><Link href="/login" className="absolute top-4 left-2 px-4 py-2 text-sm text-black">←</Link><h1 className="mb-8 text-center text-3xl font-bold text-black">Redefinir Senha</h1><form onSubmit={redefinir}><div className="mb-6"><label htmlFor="novaSenha" className="mb-2 block text-sm font-medium text-gray-700">Nova senha</label><input id="novaSenha" type="password" value={senhas.nova} onChange={(e) => setSenhas({ ...senhas, nova: e.target.value })} placeholder="Digite sua nova senha" className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none" /></div><div className="mb-6"><label htmlFor="confNovaSenha" className="mb-2 block text-sm font-medium text-gray-700">Confirmar senha</label><input id="confNovaSenha" type="password" value={senhas.confirmacao} onChange={(e) => setSenhas({ ...senhas, confirmacao: e.target.value })} placeholder="Confirme sua nova senha" className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none" /></div><button type="submit" className="w-full rounded-md bg-red-600 py-3 text-lg font-semibold text-white transition hover:bg-red-700">Redefinir Senha</button><p className={`mt-4 text-center text-sm font-bold ${mensagem.includes("sucesso") ? "text-green-600" : "text-red-600"}`}>{mensagem}</p></form></AuthBackground>;
}
