"use client";

import { useEffect, useState } from "react";
import { aguardarDisponibilidadeApi, ehFalhaTransitoriaApi, normalizarExibicao } from "@busca-bus/core";
import { criarClienteApi } from "@busca-bus/core/cliente";
import { FIXTURE_ONIBUS } from "@/lib/fixtures/exibicaoFixture";
import { useLoading } from "@/contexts/LoadingContext";

export default function useExibicao(codigo) {
  const [exibicao, setExibicao] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(process.env.NEXT_PUBLIC_API_URL));
  const [erro, setErro] = useState(null);
  const { startLoading, stopLoading, showError } = useLoading();
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL) return;
    let cancelado = false;
    const controlador = new AbortController();
    const cliente = criarClienteApi(process.env.NEXT_PUBLIC_API_URL);
    async function carregar() {
      const tokenCarregamento = startLoading("Carregando exibição...", "Por favor, aguarde.");
      try {
        let resposta;
        try {
          resposta = await cliente.obterExibicao(codigo);
        } catch (erroApi) {
          if (!ehFalhaTransitoriaApi(erroApi)) throw erroApi;
          let health;
          try {
            health = await cliente.obterHealth();
          } catch {
            health = null;
          }
          if (health) {
            throw erroApi;
          }
          stopLoading(tokenCarregamento);
          const tokenInicializacao = startLoading(
            "Os serviços estão sendo iniciados.",
            "Isso pode levar até 1 minuto.\nAguarde enquanto tentamos novamente.",
          );
          try {
            await aguardarDisponibilidadeApi(process.env.NEXT_PUBLIC_API_URL, {
              sinal: controlador.signal,
            });
          } finally {
            stopLoading(tokenInicializacao);
          }
          resposta = await cliente.obterExibicao(codigo);
        }
        if (!cancelado) setExibicao(normalizarExibicao(resposta.exibicao));
      } catch (erroApi) {
        if (cancelado || erroApi.name === "AbortError") return;
        setErro(erroApi.message);
        showError(
          erroApi.status === 503 && erroApi.detalhe?.erro === "Banco de dados não configurado."
            ? "A exibição não está disponível neste ambiente."
            : "Não foi possível carregar a exibição.",
          erroApi.status === 503 && erroApi.detalhe?.erro === "Banco de dados não configurado."
            ? "Use o código de teste configurado para este ambiente."
            : "Verifique o código e tente novamente.",
          erroApi.message,
        );
      } finally {
        if (!cancelado) {
          setCarregando(false);
          stopLoading(tokenCarregamento);
        }
      }
    }
    carregar();
    return () => {
      cancelado = true;
      controlador.abort();
    };
  }, [codigo, showError, startLoading, stopLoading]);
  return { exibicao, carregando, erro, onibus: FIXTURE_ONIBUS };
}
