"use client";

import { useState } from "react";

import { ChevronDown } from 'lucide-react';

export default function InfoCard({ titulo, children }) {
    const [aberto, setAberto] = useState(false);

	return (
		<div className="flex flex-col px-5 p-2.5 m-5 w-2/3 bg-white text-black rounded-2xl">
            <button
                type="button"
                onClick={() => setAberto((valorAtual) => !valorAtual)}
                aria-expanded={aberto}
                className="flex flex-row justify-between items-center p-1.5 cursor-pointer"
            >
                <span className="font-bold text-base">{titulo}</span>
                <span
                    className={`font-bold text-base transition-transform duration-200 ${
                        aberto ? "rotate-180" : ""
                    }`}
                >
                    <ChevronDown/>
                </span>
            </button>

            {aberto && (
                <>
                    <div className="border-t w-full" />
                    <div className="font-medium text-base p-4">{children}</div>
                </>
            )}
		</div>
	);
}
