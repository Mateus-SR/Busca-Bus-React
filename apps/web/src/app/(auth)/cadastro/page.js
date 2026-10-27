
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthLinks from "@/components/auth/AuthLinks";
import InstituicaoSelect from "@/components/ui/InstituicaoSelect";
import { validarEmail, validarSenha } from "@busca-bus/core";
import { Eye, EyeOff } from "lucide-react";

const LIMITE_NOME = 25;

export default function CadastroPage() {
  const router = useRouter();

  const [formulario, setFormulario] = useState({
    nome: "",
    instituicao: "",
    semInstituicao: false,
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const [mensagem, setMensagem] = useState("");
  const [cadastrando, setCadastrando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function cadastrar(evento) {
    evento.preventDefault();
    setMensagem("");

    const { nome, email, senha, confirmarSenha } = formulario;

    if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
      setMensagem("Por favor, preencha todos os campos.");
      return;
    }

    if (nome.trim().length > LIMITE_NOME) {
      setMensagem(`O nome deve ter no máximo ${LIMITE_NOME} caracteres.`);
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

    if (senha !== confirmarSenha) {
      setMensagem("As senhas estão diferentes.");
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
      <h1 className="mb-8 text-center text-3xl font-bold text-texto">
        Cadastro
      </h1>

      <Link
        href="/"
        className="absolute top-12 left-6 inline-flex items-center gap-1 text-sm text-texto transition hover:text-destaque"
      >
        
        ← Voltar
      </Link>

      <form onSubmit={cadastrar}>
        <div className="mb-6">
          <label
            htmlFor="nome"
            className="mb-2 block text-sm font-medium text-texto-suave"
          >
            Nome
          </label>
          <input
            id="nome"
            value={formulario.nome}
            maxLength={LIMITE_NOME}
            aria-describedby="nome-ajuda"
            onChange={(e) =>
              setFormulario({ ...formulario, nome: e.target.value })
            }
            placeholder="exemplo: Luciano Batista"
            className="w-full rounded-md border border-borda px-4 py-3 text-lg focus:ring-2 focus:ring-foco focus:outline-none"
          />
          <p id="nome-ajuda" className="mt-1 text-xs text-texto-mudo">
            Até {LIMITE_NOME} caracteres.
          </p>
        </div>

        <InstituicaoSelect
          instituicao={formulario.instituicao}
          semInstituicao={formulario.semInstituicao}
          onChange={(alteracoes) =>
            setFormulario((atual) => ({ ...atual, ...alteracoes }))
          }
        />

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
            value={formulario.email}
            onChange={(e) =>
              setFormulario({ ...formulario, email: e.target.value })
            }
            placeholder="exemplo: guilherme@calixto.com"
            className="w-full rounded-md border border-borda px-4 py-3 text-lg focus:ring-2 focus:ring-foco focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-texto-suave"
          >
            Senha
          </label>

          <div className="relative">
            <input
              id="password"
              type={mostrarSenha ? "text" : "password"}
              value={formulario.senha}
              onChange={(e) =>
                setFormulario({ ...formulario, senha: e.target.value })
              }
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

        <div className="mb-6">
          <label
            htmlFor="confirmarSenha"
            className="mb-2 block text-sm font-medium text-texto-suave"
          >
            Confirmar senha
          </label>

          <input
            id="confirmarSenha"
            type="password"
            value={formulario.confirmarSenha}
            onChange={(e) =>
              setFormulario({
                ...formulario,
                confirmarSenha: e.target.value,
              })
            }
            placeholder="Digite a senha novamente"
            className="w-full rounded-md border border-borda px-4 py-3 text-lg focus:ring-2 focus:ring-foco focus:outline-none"
          />
        </div>



        {mensagem && (
          <p className="mb-5 text-center text-sm font-semibold text-erro">
            {mensagem}
          </p>
        )}

        <div className="flex flex-col items-center space-y-6">
          <button
            type="submit"
            disabled={cadastrando}
            className="w-full max-w-md rounded-md bg-destaque px-4 py-3 text-lg font-semibold text-sobre-destaque transition hover:bg-destaque-forte disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cadastrando ? "Cadastrando..." : "Cadastrar"}
          </button>
          <AuthLinks href="/login">Já tenho uma conta</AuthLinks>
        </div>
      </form>
    </AuthBackground>
  );
}
