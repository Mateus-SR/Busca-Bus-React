"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function InstituicaoSelect({
  instituicao,
  semInstituicao,
  onChange,
}) {
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [instituicoes, setInstituicoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function carregarInstituicoes() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await fetch(`${API_URL}/v1/fatecs`, {
          signal: controller.signal,
        });

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar as instituições.");
        }

        const dados = await resposta.json();

        setInstituicoes(
          Array.isArray(dados.fatecs) ? dados.fatecs : []
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setErro(error.message || "Erro ao carregar instituições.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregarInstituicoes();

    return () => controller.abort();
  }, []);

  const instituicaoSelecionada = instituicoes.find(
    (item) => item.id_fac === instituicao
  );

  function selecionarInstituicao(id) {
    onChange({ instituicao: id, semInstituicao: false });
    setDropdownAberto(false);
  }

  function alternarSemInstituicao(evento) {
    const selecionado = evento.target.checked;

    onChange({
      instituicao: selecionado ? "" : instituicao,
      semInstituicao: selecionado,
    });

    setDropdownAberto(false);
  }

  return (
    <div className="mb-6">
      <label className="mb-2 block text-sm font-medium text-texto-suave">
        Instituição (opcional)
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() =>
            !semInstituicao && setDropdownAberto((aberto) => !aberto)
          }
          className={`w-full rounded-md border border-borda px-4 py-3 text-left ${
            semInstituicao
              ? "cursor-not-allowed bg-superficie-alt text-texto-desabilitado"
              : "bg-superficie"
          }`}
        >
          {semInstituicao
            ? "Nenhuma instituição selecionada"
            : instituicaoSelecionada?.nome_fac ?? "Selecione uma instituição"}

          <ChevronDown className="float-right" />
        </button>

        {dropdownAberto && (
          <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-borda bg-superficie shadow-lg">
            {carregando && (
              <p className="px-4 py-3 text-sm text-texto-suave">
                Carregando instituições...
              </p>
            )}

            {!carregando && erro && (
              <p className="px-4 py-3 text-sm text-red-500">
                {erro}
              </p>
            )}

            {!carregando && !erro && instituicoes.length === 0 && (
              <p className="px-4 py-3 text-sm text-texto-suave">
                Nenhuma instituição encontrada.
              </p>
            )}

            {!carregando &&
              !erro &&
              instituicoes.map((item) => (
                <button
                  type="button"
                  key={item.id_fac}
                  onClick={() => selecionarInstituicao(item.id_fac)}
                  className="block w-full px-4 py-2 text-left text-texto hover:bg-superficie-alt"
                >
                  {item.nome_fac}
                </button>
              ))}
          </div>
        )}
      </div>

      <label className="mt-3 flex items-center text-sm text-texto-suave">
        <input
          type="checkbox"
          checked={semInstituicao}
          onChange={alternarSemInstituicao}
          className="mr-2"
        />
        Não faço parte de uma instituição / Prefiro não informar
      </label>
    </div>
  );
}