
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthLinks from "@/components/auth/AuthLinks";
import { validarEmail, validarSenha } from "@busca-bus/core";

export default function CadastroPage() {
  const router = useRouter();

  const [formulario, setFormulario] = useState({
    nome: "",
    email: "",
    senha: "",
  });

  const [mensagem, setMensagem] = useState("");
  const [cadastrando, setCadastrando] = useState(false);

  async function cadastrar(evento) {
    evento.preventDefault();
    setMensagem("");

    const { nome, email, senha } = formulario;

    if (!nome.trim() || !email.trim() || !senha) {
      setMensagem("Por favor, preencha todos os campos.");
      return;
    }

    if (!validarEmail(email)) {
      setMensagem("Informe um e-mail válido.");
      return;
    }

    if (!validarSenha(senha)) {
      setMensagem(
        "A senha precisa ter letras e números, e no mínimo 6 caracteres."
      );
      return;
    }

    setCadastrando(true);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const resposta = await fetch(`${API_URL}/v1/auth/cadastro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          senha,
        }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setMensagem(
          dados.erro ||
            dados.mensagem ||
            "Não foi possível realizar o cadastro."
        );
        return;
      }

      router.push("/login");
    } catch (erro) {
      setMensagem(
        "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
      );
    } finally {
      setCadastrando(false);
    }
  }

  return (
    <AuthBackground>
      <h1 className="mb-8 text-center text-3xl font-bold text-black">
        Cadastro
      </h1>

      <Link
        href="/"
        className="absolute top-12 left-6 text-sm text-black"
      >
        Voltar
      </Link>

      <form onSubmit={cadastrar}>
        <div className="mb-6">
          <label
            htmlFor="nome"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Nome
          </label>
          <input
            id="nome"
            value={formulario.nome}
            onChange={(e) =>
              setFormulario({ ...formulario, nome: e.target.value })
            }
            placeholder="exemplo: Luciano Batista"
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={formulario.email}
            onChange={(e) =>
              setFormulario({ ...formulario, email: e.target.value })
            }
            placeholder="exemplo: guilherme@calixto.com"
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={formulario.senha}
            onChange={(e) =>
              setFormulario({ ...formulario, senha: e.target.value })
            }
            placeholder="senhaSegura123"
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>

        {mensagem && (
          <p className="mb-5 text-center text-sm font-semibold text-red-600">
            {mensagem}
          </p>
        )}

        <div className="flex flex-col items-center space-y-6">
          <AuthLinks href="/login">Já tenho uma conta</AuthLinks>

          <button
            type="submit"
            disabled={cadastrando}
            className="w-full max-w-md rounded-md bg-red-600 px-4 py-3 text-lg font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cadastrando ? "Cadastrando..." : "Cadastrar"}
          </button>
        </div>
      </form>
    </AuthBackground>
  );
}
