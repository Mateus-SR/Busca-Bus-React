"use client";

import React, { useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";

export default function FeedbackForm({ user }: { user: any }) {
  const [nps, setNps] = useState<number | null>(null);
  const [navegacao, setNavegacao] = useState<number | null>(null);
  const [ajudaViagem, setAjudaViagem] = useState("");
  const [avaliacaoProjeto, setAvaliacaoProjeto] = useState<number | null>(null);
  const [sugestoes, setSugestoes] = useState("");
  const [enviado, setEnviado] = useState(false);

  // Declarando a função como 'async' e garantindo o fechamento correto da chave
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      userId: user?.id,
      nps,
      navegacao,
      ajudaViagem,
      avaliacaoProjeto,
      sugestoes,
      dataEnvio: new Date().toISOString(),
    };

    // Este fetch enviará os dados. Mude 'SUA_PORTA' quando tiver o backend pronto.
    try {
      await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
    }

    setEnviado(true);
  };

  if (enviado) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-superficie rounded-2xl border-2 border-current/10 text-center animate-in fade-in zoom-in duration-300">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold">Avaliação enviada com sucesso!</h3>
        <p className="opacity-70 mt-2">Muito obrigado por ajudar a melhorar o BuscaBus.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-superficie p-6 sm:p-8 rounded-2xl border-2 border-current/10 shadow-sm">
      
      {/* 1. NPS */}
      <div className="space-y-3">
        <label className="block text-base font-bold">
          1. Qual a probabilidade de você recomendar o BuscaBus para um amigo ou colega? (0 a 10)
        </label>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setNps(num)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                nps === num
                  ? "bg-red-600 text-white border-red-600 scale-110"
                  : "bg-transparent border-current/20 hover:border-red-500 hover:text-red-500"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Navegação (CSAT 1-5) */}
      <div className="space-y-3">
        <label className="block text-base font-bold">
          2. Como você avalia a facilidade de navegação do sistema? (1 a 5)
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={`nav-${star}`} type="button" onClick={() => setNavegacao(star)} className="focus:outline-none transition-transform hover:scale-110">
              <Star
                className={`w-8 h-8 ${
                  (navegacao ?? 0) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent border-current/20 opacity-30 hover:opacity-100"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 3. Ajuda em Viagem (Texto Aberto) */}
      <div className="space-y-3">
        <label htmlFor="ajudaViagem" className="block text-base font-bold">
          3. O BuscaBus te ajudou em alguma viagem específica? Conte-nos como foi.
        </label>
        <textarea
          id="ajudaViagem"
          rows={3}
          value={ajudaViagem}
          onChange={(e) => setAjudaViagem(e.target.value)}
          placeholder="Ex: Consegui não perder o ônibus na chuva..."
          className="w-full p-3 bg-transparent border-2 border-current/20 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-y"
        />
      </div>

      {/* 4. Avaliação do Projeto (CSAT 1-5) */}
      <div className="space-y-3">
        <label className="block text-base font-bold">
          4. Como você avalia o projeto BuscaBus de forma geral? (1 a 5)
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={`proj-${star}`} type="button" onClick={() => setAvaliacaoProjeto(star)} className="focus:outline-none transition-transform hover:scale-110">
              <Star
                className={`w-8 h-8 ${
                  (avaliacaoProjeto ?? 0) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent border-current/20 opacity-30 hover:opacity-100"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 5. Sugestões (Texto Aberto) */}
      <div className="space-y-3">
        <label htmlFor="sugestoes" className="block text-base font-bold">
          5. Tem alguma sugestão ou opinião para melhorar a plataforma?
        </label>
        <textarea
          id="sugestoes"
          rows={3}
          value={sugestoes}
          onChange={(e) => setSugestoes(e.target.value)}
          placeholder="Deixe aqui suas ideias..."
          className="w-full p-3 bg-transparent border-2 border-current/20 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={nps === null || navegacao === null || avaliacaoProjeto === null}
        className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        Enviar Avaliação
      </button>
    </form>
  );
}