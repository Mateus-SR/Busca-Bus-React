
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthLinks from "@/components/auth/AuthLinks";
import InstituicaoSelect from "@/components/ui/InstituicaoSelect";
import { validarEmail, validarSenha } from "@busca-bus/core";
import { Eye, EyeOff, CheckCircle2, LoaderCircle } from "lucide-react";

const LIMITE_NOME = 25;

function validarDominioEmail(email) {
  const dominio = email.trim().toLowerCase().split("@")[1];

  if (!dominio) return false;

  const dominiosPermitidos = [
    "gmail.com",
    "icloud.com",
    "me.com",
    "yahoo.com",
    "yahoo.com.br",
    "outlook.com",
    "outlook.com.br",
    "hotmail.com",
    "hotmail.com.br",
  ];

  if (dominiosPermitidos.includes(dominio)) return true;

  const nomeDominio = dominio.split(".")[0];
  const provedores = ["gmail", "icloud", "yahoo", "outlook", "hotmail"];

  function distanciaEdicaoUm(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;

    let i = 0;
    let j = 0;
    let diferencas = 0;

    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        i++;
        j++;
      } else {
        diferencas++;

        if (diferencas > 1) return false;

        if (a.length > b.length) i++;
        else if (b.length > a.length) j++;
        else {
          i++;
          j++;
        }
      }
    }

    if (i < a.length || j < b.length) diferencas++;

    return diferencas <= 1;
  }

  return !provedores.some((provedor) =>
    distanciaEdicaoUm(nomeDominio, provedor)
  );
}

export default function CadastroPage() {
  const router = useRouter();

  function voltar() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  const [formulario, setFormulario] = useState({
    nome: "",
    instituicao: "",
    semInstituicao: false,
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const [mensagem, setMensagem] = useState("");
  const [mensagemVisivel, setMensagemVisivel] = useState(false);
  const [contadorMensagem, setContadorMensagem] = useState(0);
  const [cadastrando, setCadastrando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [statusCadastro, setStatusCadastro] = useState("formulario");

  useEffect(() => {
    if (statusCadastro === "sucesso") {
      const tempo = setTimeout(() => {
        setStatusCadastro("redirecionando");
      }, 3000);

      return () => clearTimeout(tempo);
    }

    if (statusCadastro === "redirecionando") {
      const tempo = setTimeout(() => {
        router.replace("/login");
      }, 1000);

      return () => clearTimeout(tempo);
    }
  }, [statusCadastro, router]);

  useEffect(() => {
    if (!mensagem) return;

    setMensagemVisivel(true);

    const fade = setTimeout(() => {
      setMensagemVisivel(false);
    }, 3500);

    const limpar = setTimeout(() => {
      setMensagem("");
    }, 4000);

    return () => {
      clearTimeout(fade);
      clearTimeout(limpar);
    };
  }, [mensagem, contadorMensagem]);

  function mostrarMensagem(texto) {
    setMensagem(texto);
    setMensagemVisivel(true);
    setContadorMensagem((atual) => atual + 1);
  }

  async function cadastrar(evento) {
    evento.preventDefault();
    setMensagem("");

    const { nome, email, senha, confirmarSenha } = formulario;

    if (!nome.trim()) {
      mostrarMensagem("Informe seu nome.");
      return;
    }

    if (nome.trim().length > LIMITE_NOME) {
      mostrarMensagem(`O nome deve ter no máximo ${LIMITE_NOME} caracteres.`);
      return;
    }

    if (!formulario.semInstituicao && !formulario.instituicao) {
      mostrarMensagem(
        "Selecione sua instituição ou marque a opção de que não faz parte de nenhuma."
      );
      return;
    }

    if (!email.trim()) {
      mostrarMensagem("Informe seu e-mail.");
      return;
    }

    if (!validarEmail(email) || !validarDominioEmail(email)) {
      mostrarMensagem("Informe um e-mail válido.");
      return;
    }

    if (!senha) {
      mostrarMensagem("Informe uma senha.");
      return;
    }

    if (!validarSenha(senha)) {
      mostrarMensagem(
        "A senha precisa ter letras e números, e no mínimo 6 caracteres."
      );
      return;
    }

    if (!confirmarSenha) {
      mostrarMensagem("Confirme sua senha.");
      return;
    }

    if (senha !== confirmarSenha) {
      mostrarMensagem("As senhas não coincidem.");
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
          fac_id: formulario.semInstituicao
            ? null
            : formulario.instituicao || null,
        }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        mostrarMensagem(
          dados.erro ||
          dados.mensagem ||
          "Não foi possível realizar o cadastro."
        );
        return;
      }

      setStatusCadastro("sucesso");
    } catch (erro) {
      mostrarMensagem(
        "Não foi possível conectar ao servidor. Tente novamente mais tarde."
      );
    } finally {
      setCadastrando(false);
    }
  }

  if (statusCadastro === "sucesso") {
    return (
      <AuthBackground>
        <div className="flex flex-col items-center py-10 text-center">
          <CheckCircle2 size={76} className="mb-6 text-green-500" />

          <h1 className="mb-3 text-2xl font-bold text-texto">
            Conta criada com sucesso!
          </h1>

          <p className="text-texto-suave">
            Seu cadastro foi realizado. Você será encaminhado para a tela de login.
          </p>
        </div>
      </AuthBackground>
    );
  }

  if (statusCadastro === "redirecionando") {
    return (
      <AuthBackground largura="max-w-md">
        <div className="flex flex-col items-center py-10 text-center">
          <LoaderCircle
            size={64}
            className="mb-6 animate-spin text-destaque"
          />

          <h1 className="text-2xl font-bold text-texto">
            Preparando seu acesso...
          </h1>

          <p className="mt-3 text-texto-suave">
            Redirecionando para o login.
          </p>
        </div>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <h1 className="mb-8 text-center text-3xl font-bold text-texto">
        Cadastro
      </h1>

      <button
        type="button"
        onClick={voltar}
        className="absolute top-12 left-6 inline-flex cursor-pointer items-center gap-1 text-sm text-texto transition hover:text-destaque hover:underline"
      >

        ← Voltar
      </button>

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
          <p
            className={`mb-5 text-center text-sm font-semibold text-erro transition-opacity duration-500 ${mensagemVisivel ? "opacity-100" : "opacity-0"
              }`}
          >
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
