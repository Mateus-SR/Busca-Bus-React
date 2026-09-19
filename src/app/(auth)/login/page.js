"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthLinks from "@/components/auth/AuthLinks";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formulario, setFormulario] = useState({ email: "", senha: "", lembrar: false });
  const [mensagem, setMensagem] = useState("");

  function atualizar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function entrar(evento) {
    evento.preventDefault();
    if (!formulario.email || !formulario.senha) {
      setMensagem("Por favor, preencha todos os campos.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email)) {
      setMensagem("Informe um e-mail válido.");
      return;
    }
    login();
    router.push("/");
  }

  return (
    <AuthBackground>
      <h1 className="mb-8 text-center text-3xl font-bold text-black">Login</h1>
      <Link href="/" className="absolute top-12 left-6 text-sm text-black">Voltar</Link>
      <button type="button" onClick={() => setMensagem("Nesta versão demonstrativa, o reset de senha é simulado.")} className="absolute top-12 right-6 text-sm text-black">Esqueci a senha...</button>
      <form onSubmit={entrar}>
        <div className="mb-6">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">E-mail</label>
          <input id="email" type="email" value={formulario.email} onChange={(e) => atualizar("email", e.target.value)} placeholder="exemplo: erick@neo.com" className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">Senha</label>
          <input id="password" type="password" value={formulario.senha} onChange={(e) => atualizar("senha", e.target.value)} placeholder="senhaSegura123" className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none" />
        </div>
        <label className="mb-6 flex items-center text-sm text-gray-700">
          <input type="checkbox" checked={formulario.lembrar} onChange={(e) => atualizar("lembrar", e.target.checked)} className="mr-2" />
          Lembre de mim
        </label>
        {mensagem && <p className="mb-5 text-center text-sm font-semibold text-red-600">{mensagem}</p>}
        <div className="flex flex-col items-center space-y-6">
          <AuthLinks href="/cadastro">Não tenho uma conta</AuthLinks>
          <button type="submit" className="w-full max-w-md rounded-md bg-red-600 px-4 py-3 text-lg font-semibold text-white transition hover:bg-red-700">Entrar</button>
        </div>
      </form>
    </AuthBackground>
  );
}
