"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcessoRapidoForm() {
    const [codigo, setCodigo] = useState("");
    const [erro, setErro] = useState(false);
    const router = useRouter();

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
        router.push(`/exibicao/${encodeURIComponent(codigo)}`);
    }

    return (
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
        </div>
    )
}