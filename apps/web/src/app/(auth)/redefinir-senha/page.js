"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthLinks from "@/components/auth/AuthLinks";
import { validarSenha } from "@busca-bus/core";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function RedefinirSenhaPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    async function redefinirSenha(evento) {
        evento.preventDefault();
        setMensagem("");

        if (!token) {
            setMensagem("Link de recuperação inválido ou expirado.");
            return;
        }

        if (!validarSenha(senha)) {
            setMensagem("A senha deve conter letras e números, com no mínimo 6 caracteres.");
            return;
        }

        if (senha !== confirmarSenha) {
            setMensagem("As senhas estão diferentes.");
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
            setMensagem(error.message || "Erro ao redefinir a senha.");
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
                            <input
                                id="senha"
                                type="password"
                                value={senha}
                                onChange={(evento) => setSenha(evento.target.value)}
                                placeholder="Digite sua nova senha"
                                autoComplete="new-password"
                                className="w-full rounded-md border border-borda px-4 py-3 text-lg focus:ring-2 focus:ring-foco focus:outline-none"
                            />
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
                            <p className="text-center text-sm font-semibold text-erro">
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