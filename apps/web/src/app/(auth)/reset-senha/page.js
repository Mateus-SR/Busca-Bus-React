"use client";

import Link from "next/link";
import { useState } from "react";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthLinks from "@/components/auth/AuthLinks";
import { validarEmail } from "@busca-bus/core";

export default function ResetSenhaPage() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);

  function solicitarRedefinicao(evento) {
    evento.preventDefault();
    setMensagem("");

    if (!email.trim()) {
      setMensagem("Informe o e-mail cadastrado.");
      return;
    }

    if (!validarEmail(email.trim())) {
      setMensagem("Informe um e-mail válido.");
      return;
    }

    setEnviado(true);
  }

  return (
    <AuthBackground largura="max-w-2xl">
      {!enviado && (
        <Link
          href="/login"
          className="absolute top-4 left-2 px-4 py-2 text-sm text-texto transition hover:text-destaque"
        >
          ← Voltar
        </Link>
      )}

      {enviado ? (
        <div className="flex flex-col items-center gap-6">
          <p className="text-center text-sm font-semibold text-sucesso">
            Se houver uma conta com este e-mail, você receberá as instruções
            para redefinir sua senha.
          </p>
          <AuthLinks href="/login">Voltar para o login</AuthLinks>
        </div>
      ) : (
        <>
          <h1 className="mb-4 text-center text-3xl font-bold text-texto">
            Esqueci minha senha
          </h1>
          <p className="mb-8 text-center text-sm text-texto-secundario">
            Informe seu e-mail e enviaremos as instruções para redefinir sua
            senha.
          </p>
          <form onSubmit={solicitarRedefinicao}>
            <div className="mb-6">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-texto-suave"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="exemplo: erick@neo.com"
                autoComplete="email"
                className="w-full rounded-md border border-borda px-4 py-3 text-lg focus:ring-2 focus:ring-foco focus:outline-none"
              />
            </div>

            {mensagem && (
              <p className="mb-5 text-center text-sm font-semibold text-erro">
                {mensagem}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-destaque py-3 text-lg font-semibold text-sobre-destaque transition hover:bg-destaque-forte"
            >
              Enviar instruções
            </button>
          </form>
        </>
      )}
    </AuthBackground>
  );
}
