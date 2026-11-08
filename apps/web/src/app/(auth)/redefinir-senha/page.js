"use client";

import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthLinks from "@/components/auth/AuthLinks";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function RedefinirSenhaPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mensagem, setMensagem] = useState("");
    const [mensagemVisivel, setMensagemVisivel] = useState(false);
    const [contadorMensagem, setContadorMensagem] = useState(0);
    const [carregando, setCarregando] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    useEffect(() => {
        if (!mensagem) return;

        setMensagemVisivel(true);

        const timeoutFade = setTimeout(() => {
            setMensagemVisivel(false);
        }, 3500);

        const timeoutLimpar = setTimeout(() => {
            setMensagem("");
        }, 4000);

        return () => {
            clearTimeout(timeoutFade);
            clearTimeout(timeoutLimpar);
        };
    }, [mensagem, contadorMensagem]);

    function exibirMensagem(texto) {
        setMensagem(texto);
        setContadorMensagem((anterior) => anterior + 1);
    }

    async function redefinirSenha(evento) {
        evento.preventDefault();
        setMensagem("");
        setMensagemVisivel(false);

        if (!token) {
            exibirMensagem("Link de recuperação inválido ou expirado.");
            return;
        }

        if (senha.length < 6 || !/[0-9]/.test(senha) || !/[^a-zA-Z0-9]/.test(senha)) {
            exibirMensagem("A senha deve ter no mínimo 6 caracteres, incluindo pelo menos um número e um símbolo.");
            return;
        }

        if (senha !== confirmarSenha) {
            exibirMensagem("As senhas estão diferentes.");
            return;
        }

        setCarregando(true);

        try {
            const resposta = await fetch(`${API_URL}/v1/auth/reset-senha`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    senha,
                }),
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || "Não foi possível redefinir a senha.");
            }

            setSucesso(true);
        } catch (error) {
            exibirMensagem(error.message || "Erro ao redefinir a senha.");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <AuthBackground largura="max-w-2xl">

            {sucesso ? (
                <div className="flex flex-col items-center gap-6">
                    <p className="text-center text-sm font-semibold text-sucesso">
                        Sua senha foi redefinida com sucesso!
                    </p>

                    <AuthLinks href="/login">Voltar para o login</AuthLinks>
                </div>
            ) : (
                <>

                    <h1 className="mb-4 text-center text-3xl font-bold text-texto">
                        Redefinir senha
                    </h1>

                    <form onSubmit={redefinirSenha} className="flex flex-col gap-5">
                        <div>
                            <label
                                htmlFor="senha"
                                className="mb-2 block text-sm font-medium text-texto-suave"
                            >
                                Nova senha
                            </label>
                            <div className="relative">
                                <input
                                    id="senha"
                                    type={mostrarSenha ? "text" : "password"}
                                    value={senha}
                                    onChange={(evento) => setSenha(evento.target.value)}
                                    placeholder="Digite sua nova senha"
                                    autoComplete="new-password"
                                    className="w-full rounded-md border border-borda px-4 py-3 pr-12 text-lg focus:ring-2 focus:ring-foco focus:outline-none"
                                />

                                <button
                                    type="button"
                                    onClick={() => setMostrarSenha(!mostrarSenha)}
                                    className="absolute inset-y-0 right-3 flex items-center text-texto-suave hover:text-texto"
                                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {mostrarSenha ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="confirmarSenha"
                                className="mb-2 block text-sm font-medium text-texto-suave"
                            >
                                Confirmar nova senha
                            </label>
                            <input
                                id="confirmarSenha"
                                type="password"
                                value={confirmarSenha}
                                onChange={(evento) => setConfirmarSenha(evento.target.value)}
                                placeholder="Digite novamente sua senha"
                                autoComplete="new-password"
                                className="w-full rounded-md border border-borda px-4 py-3 text-lg focus:ring-2 focus:ring-foco focus:outline-none"
                            />
                        </div>

                        {mensagem && (
                            <p
                                className={`text-center text-sm font-semibold text-erro transition-opacity duration-500 ${mensagemVisivel ? "opacity-100" : "opacity-0"
                                    }`}
                            >
                                {mensagem}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={carregando}
                            className="w-full rounded-md bg-destaque py-3 text-lg font-semibold text-sobre-destaque transition hover:bg-destaque-forte disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {carregando ? "Redefinindo..." : "Redefinir senha"}
                        </button>
                    </form>
                </>
            )}

        </AuthBackground>
    );
}