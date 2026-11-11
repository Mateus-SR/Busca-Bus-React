"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { distanciaMetros } from "@busca-bus/core";
import useBuscaPontos from "@/hooks/useBuscaPontos";
import { ZOOM_MINIMO_GLOBAL, visaoPermiteBusca } from "@/hooks/usePontosNaArea";
import ListaPontos from "@/components/pontos/ListaPontos";

const LIMITE_LISTA = 30;

const dentro = (ponto, visao) => ponto.lat <= visao.norte && ponto.lat >= visao.sul && ponto.lng <= visao.leste && ponto.lng >= visao.oeste;

// Modo "todos os pontos": busca por nome/endereço/código e lista dos pontos da área visível do mapa.
// `area` vem de usePontosNaArea, chamado no PontosView porque os mesmos pontos também são desenhados no mapa.

export default function PainelGlobal({ area, visao, posicao, selecionado, copiado, marcados, podeMarcar, onAlternarMarca, onSelecionar, onCopiar, onIrPara }) {
  const [texto, setTexto] = useState("");
  const busca = useBuscaPontos(texto);

  const visiveis = useMemo(() => {
    if (!visao || !visaoPermiteBusca(visao)) return [];
    const referencia = posicao ?? { lat: (visao.norte + visao.sul) / 2, lng: (visao.leste + visao.oeste) / 2 };
    return area.pontos
      .filter((ponto) => dentro(ponto, visao))
      .map((ponto) => ({ ponto, metros: distanciaMetros(referencia, ponto) }))
      .sort((a, b) => a.metros - b.metros)
      .slice(0, LIMITE_LISTA)
      // A distância só aparece quando a referência é a pessoa; do centro do mapa ela não diz nada útil.
      .map(({ ponto, metros }) => (posicao ? { ...ponto, distancia: metros } : ponto));
  }, [area.pontos, visao, posicao]);

  const aproximar = !visaoPermiteBusca(visao);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="busca-pontos" className="mb-1 block text-sm font-semibold text-texto-suave">Buscar por nome, endereço ou código</label>
        <div className="relative">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-texto-mudo" />
          <input
            id="busca-pontos"
            type="search"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            maxLength={80}
            autoComplete="off"
            placeholder="Ex.: Clínicas ou 18848"
            className="w-full rounded-md border border-borda-forte bg-superficie py-2.5 pr-3 pl-10 text-base text-texto focus:ring-2 focus:ring-foco focus:outline-none"
          />
        </div>
      </div>

      <div aria-live="polite" className="flex flex-col gap-2 text-sm text-texto">
        {busca.curto ? <p className="text-texto-suave">Digite pelo menos 3 caracteres para buscar.</p> : null}
        {busca.carregando ? <p className="font-semibold">Buscando...</p> : null}
        {busca.erro ? <p role="alert" className="rounded-md border border-erro bg-erro/10 p-3 text-erro-forte">{busca.erro}</p> : null}
        {busca.consultou ? <p className="font-semibold">{busca.pontos.length ? `${busca.pontos.length} ${busca.pontos.length === 1 ? "resultado" : "resultados"} para a busca.` : "Nenhum ponto encontrado para essa busca."}</p> : null}
      </div>

      <ListaPontos
        rotulo="Resultados da busca"
        pontos={busca.consultou ? busca.pontos : []}
        selecionado={selecionado}
        copiado={copiado}
        marcados={marcados}
        podeMarcar={podeMarcar}
        onAlternarMarca={onAlternarMarca}
        onSelecionar={(codigo) => onIrPara(busca.pontos.find((ponto) => ponto.codigo === codigo))}
        onCopiar={onCopiar}
      />

      <div aria-live="polite" className="flex flex-col gap-2 text-sm text-texto">
        {aproximar ? (
          <p className="rounded-md bg-superficie p-3 text-texto-suave">Aproxime o mapa (a partir do zoom {ZOOM_MINIMO_GLOBAL}) para ver os pontos de ônibus da região, ou use a busca acima.</p>
        ) : null}
        {area.erro ? (
          <p role="alert" className="rounded-md border border-erro bg-erro/10 p-3 text-erro-forte">
            {area.erro}{" "}
            <button type="button" onClick={area.recarregar} className="font-bold underline">Tentar de novo</button>
          </p>
        ) : null}
        {!aproximar && area.carregando ? <p className="font-semibold">Buscando pontos da área...</p> : null}
        {!aproximar && !area.carregando && !area.erro && !visiveis.length ? <p className="text-texto-suave">Nenhum ponto na área visível do mapa.</p> : null}
        {area.truncado ? <p className="rounded-md bg-superficie p-3 text-texto-suave">Há muitos pontos nesta área e só os primeiros foram carregados. Aproxime mais o mapa para ver todos.</p> : null}
      </div>

      {visiveis.length ? <h2 className="text-base font-bold text-texto">{posicao ? "Pontos na área do mapa, do mais perto de você" : "Pontos na área do mapa"}</h2> : null}
      <ListaPontos
        rotulo="Pontos na área visível do mapa"
        pontos={visiveis}
        selecionado={selecionado}
        copiado={copiado}
        marcados={marcados}
        podeMarcar={podeMarcar}
        onAlternarMarca={onAlternarMarca}
        onSelecionar={onSelecionar}
        onCopiar={onCopiar}
      />
    </div>
  );
}
