"use client";

import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext"; 
import FeedbackForm from "@/components/FeedbackForm";

export default function AvaliacaoPage() {
  const router = useRouter();
  const { estaLogado, carregando, usuario } = useAuth(); 

  useEffect(() => {
    if (!carregando && !estaLogado) {
      router.push("/login"); 
    }
  }, [estaLogado, carregando, router]);

  if (carregando || !estaLogado) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Fundo branco nativo (herdado) para suportar o contraste
  return (
    <main className="min-h-screen py-12 px-4 text-texto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pesquisa de Satisfação
          </h1>
          <p className="opacity-80 mt-2 text-lg">
            Sua opinião é fundamental para aprimorarmos a experiência do BuscaBus para os estudantes da Fatec.
          </p>
        </div>
        
        <FeedbackForm user={usuario || { id: "usuario-teste" }} />
      </div>
    </main>
  );
}