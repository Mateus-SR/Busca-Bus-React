"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { INSTITUICOES_MOCK } from "@/lib/fixtures/instituicoesFixture";

export default function InstituicaoSelect({
  instituicao,
  semInstituicao,
  onChange,
}) {
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const instituicaoSelecionada = INSTITUICOES_MOCK.find(
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
            {INSTITUICOES_MOCK.map((item) => (
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
