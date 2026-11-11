"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Crosshair, LocateFixed } from "lucide-react";
import { formatarDistancia } from "@busca-bus/core";
import useGeolocalizacao from "@/hooks/useGeolocalizacao";
import usePontosProximos from "@/hooks/usePontosProximos";
import usePontosNaArea, { visaoPermiteBusca } from "@/hooks/usePontosNaArea";
import CartaoPonto from "@/components/pontos/CartaoPonto";
import ListaPontos from "@/components/pontos/ListaPontos";
import PainelGlobal from "@/components/pontos/PainelGlobal";
import BarraSelecao from "@/components/pontos/BarraSelecao";

const PontosMapa = dynamic(() => import("@/components/pontos/PontosMapa"), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[320px] items-center justify-center">Carregando mapa...</div>,
});

const RAIOS = [100, 200, 300];
const RAIO_PADRAO = 200;
// Mesmo limite de pontos por exibição do formulário (/configuracao).
const LIMITE_PONTOS_EXIBICAO = 5;
// Acima disso o GPS provavelmente está pegando só a região (Wi-Fi/antena) e o ponto mais próximo pode não ser o que parece.
const PRECISAO_RUIM_METROS = 150;
const MODOS = [
  { id: "proximos", rotulo: "Perto de mim" },
  { id: "todos", rotulo: "Todos os pontos" },
];

const botao = "flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition focus:ring-2 focus:ring-foco focus:outline-none";

export default function PontosView() {
  const geo = useGeolocalizacao();
  const [modo, setModo] = useState("proximos");
  const [raio, setRaio] = useState(RAIO_PADRAO);
  const [escolhendoManual, setEscolhendoManual] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  // Pontos marcados para criar a exibição. Ficam guardados ao arrastar o mapa, trocar de modo ou de busca.
  const [marcados, setMarcados] = useState([]);
  const [copiado, setCopiado] = useState(null);
  const [avisoCopia, setAvisoCopia] = useState("");
  const [visao, setVisao] = useState(null);
  const [foco, setFoco] = useState(null);
  const temporizadorRef = useRef(null);
  const areaMapaRef = useRef(null);
  const global = modo === "todos";
  const proximos = usePontosProximos(global ? null : geo.posicao, raio);
  const area = usePontosNaArea(visao, global);

  useEffect(() => () => window.clearTimeout(temporizadorRef.current), []);

  // Sem localização liberada, escolher o local no mapa é o único caminho; fora disso, o usuário liga e desliga o modo.
  // No modo "todos os pontos" não há local de busca para escolher.
  const escolhendo = !global && (escolhendoManual || geo.status === "negada" || geo.status === "indisponivel");
  const imprecisa = geo.posicao?.precisao > PRECISAO_RUIM_METROS;

  function alternarMarca(ponto) {
    setMarcados((atuais) => {
      if (atuais.some((item) => item.codigo === ponto.codigo)) return atuais.filter((item) => item.codigo !== ponto.codigo);
      if (atuais.length >= LIMITE_PONTOS_EXIBICAO) return atuais;
      return [...atuais, { codigo: ponto.codigo, nome: ponto.nome }];
    });
  }

  const codigosMarcados = new Set(marcados.map((ponto) => ponto.codigo));
  const podeMarcar = marcados.length < LIMITE_PONTOS_EXIBICAO;

  function aoTrocarModo(novo) {
    setModo(novo);
    setEscolhendoManual(false);
    setSelecionado(null);
  }

  function aoEscolherLocal(local) {
    geo.escolherLocal(local);
    setEscolhendoManual(false);
    setSelecionado(null);
  }

  function aoUsarLocalizacao() {
    setEscolhendoManual(false);
    setSelecionado(null);
    geo.solicitar();
  }

  function aoSelecionar(codigo) {
    setSelecionado(codigo);
    // No celular o mapa fica acima da lista: traz o mapa de volta para o usuário ver o ponto.
    areaMapaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Resultado da busca por texto: o ponto pode estar longe da área atual, então o mapa vai até ele.
  function aoIrPara(ponto) {
    if (!ponto) return;
    setSelecionado(ponto.codigo);
    setFoco({ id: Date.now(), lat: ponto.lat, lng: ponto.lng, zoom: 17 });
    areaMapaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function aoCopiar(codigo) {
    window.clearTimeout(temporizadorRef.current);
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(codigo);
      setAvisoCopia(`Código ${codigo} copiado.`);
    } catch {
      setCopiado(null);
      setAvisoCopia(`Não foi possível copiar automaticamente. O código é ${codigo}.`);
    }
    temporizadorRef.current = window.setTimeout(() => {
      setCopiado(null);
      setAvisoCopia("");
    }, 4000);
  }

  const { pontos, maisProximo, erro, carregando, consultou, recarregar } = proximos;
  let resumo = "";
  if (geo.status === "solicitando") resumo = "Obtendo sua localização...";
  else if (escolhendo && !geo.posicao) resumo = "Toque no mapa para escolher o local da busca.";
  else if (carregando) resumo = "Buscando pontos...";
  else if (consultou) resumo = pontos.length ? `${pontos.length} ${pontos.length === 1 ? "ponto encontrado" : "pontos encontrados"} em até ${raio} m.` : `Nenhum ponto em até ${raio} m.`;

  const proximoRaio = RAIOS.find((valor) => valor > raio);
  const aproximarMapa = global && !visaoPermiteBusca(visao);

  return (
    <main className="flex min-h-[calc(100dvh-68px)] flex-col bg-superficie-alt lg:h-[calc(100dvh-68px)] lg:flex-row">
      <section aria-labelledby="titulo-pontos" className={`flex w-full flex-col gap-4 overflow-y-auto p-4 lg:w-[26rem] lg:shrink-0 ${marcados.length ? "pb-56" : ""}`}>
        <div>
          <h1 id="titulo-pontos" className="text-2xl font-extrabold text-texto">{global ? "Todos os pontos" : "Pontos perto de você"}</h1>
          <p className="mt-1 text-sm text-texto-suave">Encontre o código de um ponto de ônibus para criar sua exibição.</p>
        </div>

        <div role="group" aria-label="Modo de busca" className="flex gap-2">
          {MODOS.map((opcao) => (
            <button key={opcao.id} type="button" onClick={() => aoTrocarModo(opcao.id)} aria-pressed={modo === opcao.id} className={`${botao} flex-1 border ${modo === opcao.id ? "border-marca bg-marca text-sobre-marca" : "border-borda-forte bg-superficie text-texto hover:bg-superficie-forte"}`}>
              {opcao.rotulo}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <button type="button" onClick={aoUsarLocalizacao} disabled={geo.status === "solicitando"} className={`${botao} bg-marca text-sobre-marca hover:bg-marca-forte disabled:cursor-not-allowed disabled:opacity-60`}>
            <LocateFixed size={18} aria-hidden="true" />
            {geo.posicao?.origem === "gps" ? "Atualizar minha localização" : global ? "Ir para minha localização" : "Usar minha localização"}
          </button>
          {global ? null : (
            <button type="button" onClick={() => setEscolhendoManual((atual) => !atual)} aria-pressed={escolhendo} disabled={geo.status === "negada" || geo.status === "indisponivel"} className={`${botao} border border-borda-forte text-texto hover:bg-superficie-forte aria-pressed:bg-superficie-forte`}>
              <Crosshair size={18} aria-hidden="true" />
              Escolher outro local no mapa
            </button>
          )}
        </div>

        {geo.erro || (imprecisa && !global) ? (
          <div aria-live="polite" className="flex flex-col gap-2 text-sm">
            {geo.erro ? <p role="alert" className="rounded-md border border-erro bg-erro/10 p-3 text-erro-forte">{geo.erro}</p> : null}
            {imprecisa && !global ? <p className="rounded-md bg-superficie p-3 text-texto-suave">Sua localização está imprecisa (cerca de {Math.round(geo.posicao.precisao)} m). Os pontos mostrados podem não ser os mais próximos; se precisar, escolha o local no mapa.</p> : null}
          </div>
        ) : null}

        {global ? (
          <PainelGlobal area={area} visao={visao} posicao={geo.posicao} selecionado={selecionado} copiado={copiado} marcados={codigosMarcados} podeMarcar={podeMarcar} onAlternarMarca={alternarMarca} onSelecionar={aoSelecionar} onCopiar={aoCopiar} onIrPara={aoIrPara} />
        ) : (
          <>
            <fieldset>
              <legend className="mb-1 text-sm font-semibold text-texto-suave">Distância da busca</legend>
              <div className="flex gap-2">
                {RAIOS.map((valor) => (
                  <label key={valor} className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foco ${raio === valor ? "border-marca bg-marca text-sobre-marca contraste:border-acento contraste:bg-acento contraste:text-superficie" : "border-borda-forte bg-superficie text-texto"}`}>
                    <input type="radio" name="raio" value={valor} checked={raio === valor} onChange={() => setRaio(valor)} className="sr-only" />
                    {valor} m
                  </label>
                ))}
              </div>
            </fieldset>

            <div aria-live="polite" className="flex flex-col gap-2 text-sm text-texto">
              {erro ? (
                <p role="alert" className="rounded-md border border-erro bg-erro/10 p-3 text-erro-forte">
                  {erro}{" "}
                  <button type="button" onClick={recarregar} className="font-bold underline">Tentar de novo</button>
                </p>
              ) : null}
              {resumo ? <p className="font-semibold">{resumo}</p> : null}
            </div>

            {consultou && !pontos.length ? (
              <div className="flex flex-col gap-3">
                {maisProximo ? (
                  <>
                    <p className="text-sm text-texto-suave">O ponto mais próximo está a {formatarDistancia(maisProximo.distancia)}:</p>
                    <CartaoPonto ponto={maisProximo} selecionado={false} copiado={copiado === maisProximo.codigo} marcado={codigosMarcados.has(maisProximo.codigo)} podeMarcar={podeMarcar} onAlternarMarca={alternarMarca} onSelecionar={() => {}} onCopiar={aoCopiar} />
                  </>
                ) : (
                  <p className="text-sm text-texto-suave">Não encontramos pontos por aqui. Confira se o local escolhido está em São Paulo.</p>
                )}
                {proximoRaio ? (
                  <button type="button" onClick={() => setRaio(proximoRaio)} className={`${botao} border border-borda-forte text-texto hover:bg-superficie-forte`}>Ampliar a busca para {proximoRaio} m</button>
                ) : null}
              </div>
            ) : null}

            <ListaPontos rotulo="Pontos encontrados, do mais próximo ao mais distante" pontos={pontos} selecionado={selecionado} copiado={copiado} marcados={codigosMarcados} podeMarcar={podeMarcar} onAlternarMarca={alternarMarca} onSelecionar={aoSelecionar} onCopiar={aoCopiar} />
          </>
        )}

        <div aria-live="polite" className="text-sm font-semibold text-sucesso">{avisoCopia}</div>

        <p className="text-xs text-texto-mudo">
          Sua localização é usada só para esta busca: o Busca Bus não a guarda. Já sabe o código?{" "}
          <Link href="/exibicao" className="underline">Acessar exibição</Link>
        </p>
      </section>

      <div ref={areaMapaRef} className="relative order-first h-[45dvh] min-h-[320px] flex-1 lg:order-none lg:h-auto">
        {aproximarMapa ? (
          <p className="pointer-events-none absolute top-3 left-1/2 z-[1000] w-max max-w-[calc(100%-6rem)] -translate-x-1/2 rounded-full bg-superficie px-4 py-2 text-center text-sm font-bold text-texto shadow-lg">
            Aproxime o mapa para ver os pontos
          </p>
        ) : null}
        <PontosMapa
          centro={geo.posicao}
          precisao={geo.posicao?.precisao}
          raio={global ? null : raio}
          pontos={global ? area.pontos : pontos}
          selecionado={selecionado}
          onSelecionar={setSelecionado}
          escolhendo={escolhendo}
          onEscolherLocal={aoEscolherLocal}
          foco={foco}
          onVisaoMudou={setVisao}
        />
      </div>
      <BarraSelecao marcados={marcados} limite={LIMITE_PONTOS_EXIBICAO} onRemover={(codigo) => setMarcados((atuais) => atuais.filter((ponto) => ponto.codigo !== codigo))} onLimpar={() => setMarcados([])} />
    </main>
  );
}
