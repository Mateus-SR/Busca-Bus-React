"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthLinks from "@/components/auth/AuthLinks";
import { useAuth } from "@/contexts/AuthContext";
import { validarEmail } from "@busca-bus/core";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formulario, setFormulario] = useState({ email: "", senha: "", lembrar: false });
  const [mensagem, setMensagem] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  useEffect(() => {
    const lembrar = localStorage.getItem("lembrarUsuario") === "true";
    const email = localStorage.getItem("emailLembrado") || "";

    setFormulario((atual) => ({
      ...atual,
      lembrar,
      email: lembrar ? email : "",
    }));
  }, []);

  function atualizar(campo, valor) {
    setFormulario((atual) => {
      const atualizado = { ...atual, [campo]: valor };

      if (campo === "email" && atualizado.lembrar) {
        localStorage.setItem("emailLembrado", valor);
      }

      return atualizado;
    });
  }

  function alterarLembrar(marcado) {
    setFormulario((atual) => ({
      ...atual,
      lembrar: marcado,
    }));

    localStorage.setItem("lembrarUsuario", String(marcado));

    if (marcado) {
      localStorage.setItem("emailLembrado", formulario.email);
    } else {
      localStorage.removeItem("emailLembrado");
    }
  }
  async function entrar(evento) {
    evento.preventDefault();
    setMensagem("");

    if (!formulario.email || !formulario.senha) {
      setMensagem("Por favor, preencha todos os campos.");
      return;
    }

    if (!validarEmail(formulario.email)) {
      setMensagem("Informe um e-mail válido.");
      return;
    }

    try {
      await login(formulario);
      router.push("/");
    } catch (erro) {
      setMensagem(erro.message || "Não foi possível realizar o login.");
    }
  }

  return (
    <AuthBackground>
      <h1 className="mb-8 text-center text-3xl font-bold text-texto">Login</h1>
      <Link
        href="/"
        className="absolute top-12 left-6 z-30 text-sm text-texto transition hover:text-destaque"
      >
        ← Voltar
      </Link>
      <Link
        href="/reset-senha"
        className="absolute top-12 right-6 text-sm text-texto underline-offset-2 transition hover:text-destaque hover:underline"
      >
        Esqueci minha senha
      </Link>
      <form onSubmit={entrar}>
        <div className="mb-6">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-texto-suave">E-mail</label>
          <input id="email" type="email" value={formulario.email} onChange={(e) => atualizar("email", e.target.value)} placeholder="exemplo: erick@neo.com" className="w-full rounded-md border border-borda px-4 py-3 text-lg focus:ring-2 focus:ring-foco focus:outline-none" />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-texto-suave">
            Senha
          </label>

          <div className="relative">
            <input
              id="password"
              type={mostrarSenha ? "text" : "password"}
              value={formulario.senha}
              onChange={(e) => atualizar("senha", e.target.value)}
              placeholder="senhaSegura123"
              className="w-full rounded-md border border-borda px-4 py-3 pr-12 text-lg focus:ring-2 focus:ring-foco focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-texto-mudo hover:text-texto-suave"
            >
              {mostrarSenha ? (
                <Eye size={22} />
              ) : (
                <EyeOff size={22} />
              )}
            </button>
          </div>
        </div>
        <label className="mb-6 flex items-center text-sm text-texto-suave">
          <input
            type="checkbox"
            checked={formulario.lembrar}
            onChange={(e) => alterarLembrar(e.target.checked)}
            className="mr-2"
          />
          Lembre de mim
        </label>
        {mensagem && <p className="mb-5 text-center text-sm font-semibold text-erro">{mensagem}</p>}
        <div className="flex flex-col items-center space-y-6">
          <button type="submit" className="w-full max-w-md rounded-md bg-destaque px-4 py-3 text-lg font-semibold text-sobre-destaque transition hover:bg-destaque-forte">Entrar</button>
          <AuthLinks href="/cadastro">Não tenho uma conta</AuthLinks>
        </div>
      </form>
    </AuthBackground>
  );
}
