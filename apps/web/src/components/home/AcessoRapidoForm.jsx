"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, X } from "lucide-react";

export default function AcessoRapidoForm() {
    const [codigo, setCodigo] = useState("");
    const [erro, setErro] = useState(false);
    const [ajudaAberta, setAjudaAberta] = useState(false);
    const botaoFecharRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        if (!ajudaAberta) return;

        const aoApertarTecla = (evento) => {
            if (evento.key === "Escape") setAjudaAberta(false);
        };

        document.addEventListener("keydown", aoApertarTecla);
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        botaoFecharRef.current?.focus();

        return () => {
            document.removeEventListener("keydown", aoApertarTecla);
            document.body.style.overflow = overflowAnterior;
        };
    }, [ajudaAberta]);

    function handleChange(e) {
        const valorDigitado = e.target.value;

        let valorLimpo = valorDigitado.replace(/\s/g, '');
        valorLimpo = valorLimpo.replace(/[^A-Za-z0-9_-]/g, '');
        valorLimpo = valorLimpo.substring(0, 6);

        setCodigo(valorLimpo);
        setErro(valorLimpo.length > 0 && valorLimpo.length !== 6);
    }

    function handleAcessar(event) {
        event.preventDefault();
        if (codigo.length !== 6) {
            setErro(true);
            return;
        }
        router.push(`/exibicao?codigo=${encodeURIComponent(codigo)}`);
    }

    return (
        <>
        <div className="z-40 mx-auto my-10 w-full max-w-md px-4 sm:my-16 sm:px-0 md:w-1/5">
            <form onSubmit={handleAcessar} className="flex flex-col gap-2">
                <input
                    type="text"
                    value={codigo}
                    onChange={handleChange}
                    placeholder="Exemplo: UpilXc"
                    maxLength={6}
                    aria-invalid={erro}
                    aria-describedby={erro ? "codigo-erro" : undefined}
                    className={`w-full rounded-2xl border border-gray-500 px-5 py-4 text-center text-lg font-roboto-mono font-extrabold sm:px-8 sm:py-5 sm:text-xl ${
                        erro ? "bg-sptrans/25" : "bg-white"
                    }`}
                />
                <button type="submit" className="cursor-pointer rounded-2xl bg-sptrans px-5 py-4 text-center text-lg font-bold text-white shadow-lg transition-all duration-200 ease-out hover:bg-red-800 sm:px-8 sm:py-5 sm:text-2xl">
                    Acessar
                </button>
                {erro && <p id="codigo-erro" className="text-sm text-red-700">Informe um código com 6 caracteres.</p>}
            </form>
            <button
                type="button"
                onClick={() => setAjudaAberta(true)}
                className="mx-auto mt-4 flex cursor-pointer items-center gap-1 text-sm font-semibold text-sptrans underline-offset-2 transition hover:text-red-800 hover:underline"
            >
                <Info size={16} aria-hidden="true" />
                O que é esse código?
            </button>
        </div>
        {ajudaAberta && (
            <div
                className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[1px]"
                onClick={() => setAjudaAberta(false)}
                role="presentation"
            >
                <div
                    className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 text-left text-slate-900 shadow-2xl sm:p-8"
                    onClick={(evento) => evento.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="ajuda-codigo-titulo"
                >
                    <button
                        ref={botaoFecharRef}
                        type="button"
                        onClick={() => setAjudaAberta(false)}
                        aria-label="Fechar explicação sobre o código"
                        className="absolute top-4 right-4 cursor-pointer rounded-full p-1 text-gray-600 transition hover:bg-gray-100 hover:text-black"
                    >
                        <X size={22} />
                    </button>

                    <div className="pr-8">
                        <p className="text-sm font-bold tracking-[0.16em] text-sptrans uppercase">
                            Acesso rápido
                        </p>
                        <h2 id="ajuda-codigo-titulo" className="mt-1 text-2xl font-extrabold">
                            O que é esse código?
                        </h2>
                        <p className="mt-3 leading-6 text-gray-700">
                            O código é um identificador único de 6 caracteres que abre uma
                            exibição de ônibus configurada por você ou compartilhada por
                            outra pessoa.
                        </p>
                    </div>

                    <ol className="mt-5 space-y-4 text-sm text-gray-700">
                        <li className="flex gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sptrans font-bold text-white">1</span>
                            <span><strong className="text-gray-900">Recebeu um código?</strong> Digite-o no campo da página inicial para acessar os horários, atrasos e ônibus monitorados.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sptrans font-bold text-white">2</span>
                            <span><strong className="text-gray-900">Ainda não tem um?</strong> Crie sua própria exibição informando os pontos de ônibus que deseja acompanhar.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sptrans font-bold text-white">3</span>
                            <span><strong className="text-gray-900">Quer compartilhar?</strong> Envie o código da sua exibição para que outras pessoas também possam acessá-la.</span>
                        </li>
                    </ol>

                    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setAjudaAberta(false)}
                            className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                        >
                            Entendi
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/configuracao")}
                            className="rounded-xl bg-sptrans px-4 py-3 text-sm font-bold text-white transition hover:bg-red-800"
                        >
                            Criar minha exibição
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}