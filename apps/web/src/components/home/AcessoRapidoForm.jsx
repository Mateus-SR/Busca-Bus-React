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

    function handleAcessar() {
        if (!codigo) return;
        router.push(`/exibicao/${encodeURIComponent(codigo)}`);

    }

    return (
        <div className="my-16 w-1/2 md:w-1/5 mx-auto z-40">
            <div className="flex flex-col flex-wrap justify-between gap-1.5">
                <input
                    type="text"
                    value={codigo}
                    onChange={handleChange}
                    placeholder="Exemplo: UpilXc"
                    maxLength={6}
                    className={`px-12 py-5 md:px-8 md:py-5 border border-gray-500 rounded-2xl text-xl font-roboto-mono font-extrabold ${
                        erro ? "bg-sptrans/25" : "bg-white"
                    }`}
                />
                <span
                    onClick={handleAcessar}
                    className="bg-sptrans text-white font-bold text-center cursor-pointer px-12 py-5 md:px-8 md-py-5 text-lg md:text-3xl rounded-2xl shadow-lg hover:bg-red-800 transition-all duration-200 ease-out"
                >
                    Acessar
                </span>
            </div>
        </div>
    )
}