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
                    className={`w-full rounded-2xl border border-borda-enfase px-5 py-4 text-center text-lg font-roboto-mono font-extrabold sm:px-8 sm:py-5 sm:text-xl ${
                        erro ? "bg-acento/25" : "bg-superficie"
                    }`}
                />
                <button type="submit" className="cursor-pointer rounded-2xl bg-marca px-5 py-4 text-center text-lg font-bold text-sobre-marca shadow-lg transition-all duration-200 ease-out hover:bg-marca-forte sm:px-8 sm:py-5 sm:text-2xl">
                    Acessar
                </button>
                {erro && <p id="codigo-erro" className="text-sm text-erro-forte">Informe um código com 6 caracteres.</p>}
            </form>
            <button
                type="button"
                onClick={() => setAjudaAberta(true)}
                className="mx-auto mt-4 flex cursor-pointer items-center gap-1 text-sm font-semibold text-acento underline-offset-2 transition hover:text-erro-intenso hover:underline"
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
                    className="relative w-full max-w-lg rounded-2xl border border-borda-suave bg-superficie p-6 text-left text-slate-900 shadow-2xl sm:p-8"
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
                        className="absolute top-4 right-4 cursor-pointer rounded-full p-1 text-texto-secundario transition hover:bg-superficie-alt hover:text-texto"
                    >
                        <X size={22} />
                    </button>

                    <div className="pr-8">
                        <p className="text-sm font-bold tracking-[0.16em] text-acento uppercase">
                            Acesso rápido
                        </p>
                        <h2 id="ajuda-codigo-titulo" className="mt-1 text-2xl font-extrabold">
                            O que é esse código?
                        </h2>
                        <p className="mt-3 leading-6 text-texto-suave">
                            O código é um identificador único de 6 caracteres que abre uma
                            exibição de ônibus configurada por você ou compartilhada por
                            outra pessoa.
                        </p>
                    </div>

                    <ol className="mt-5 space-y-4 text-sm text-texto-suave">
                        <li className="flex gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marca font-bold text-sobre-marca">1</span>
                            <span><strong className="text-texto-forte">Recebeu um código?</strong> Digite-o no campo da página inicial para acessar os horários, atrasos e ônibus monitorados.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marca font-bold text-sobre-marca">2</span>
                            <span><strong className="text-texto-forte">Ainda não tem um?</strong> Crie sua própria exibição informando os pontos de ônibus que deseja acompanhar.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marca font-bold text-sobre-marca">3</span>
                            <span><strong className="text-texto-forte">Quer compartilhar?</strong> Envie o código da sua exibição para que outras pessoas também possam acessá-la.</span>
                        </li>
                    </ol>

                    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setAjudaAberta(false)}
                            className="rounded-xl border border-borda px-4 py-3 text-sm font-bold text-texto-suave transition hover:bg-superficie-sutil"
                        >
                            Entendi
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/configuracao")}
                            className="rounded-xl bg-marca px-4 py-3 text-sm font-bold text-sobre-destaque transition hover:bg-marca-forte"
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