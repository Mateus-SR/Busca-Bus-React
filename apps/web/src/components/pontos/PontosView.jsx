"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Crosshair, LocateFixed } from "lucide-react";
import { LIMITE_PARADAS_EXIBICAO, codigoParadaValido, formatarDistancia, limparCodigoParada } from "@busca-bus/core";
import { criarClienteApi } from "@busca-bus/core/cliente";
import useGeolocalizacao from "@/hooks/useGeolocalizacao";
import usePontosProximos from "@/hooks/usePontosProximos";
import usePontosNaArea, { visaoPermiteBusca } from "@/hooks/usePontosNaArea";
import CartaoPonto from "@/components/pontos/CartaoPonto";
import ListaPontos from "@/components/pontos/ListaPontos";
import PainelGlobal from "@/components/pontos/PainelGlobal";
import BarraSelecao from "@/components/pontos/BarraSelecao";
import { montarHrefCriador } from "@/components/pontos/hrefCriador";

const PontosMapa = dynamic(() => import("@/components/pontos/PontosMapa"), {
  ssr: false,
  loading: () => <div className="flex h-full min-h-[240px] items-center justify-center">Carregando mapa...</div>,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const RAIOS = [100, 200, 300];
const RAIO_PADRAO = 200;
const LIMITE_PONTOS_EXIBICAO = LIMITE_PARADAS_EXIBICAO;
const PRECISAO_RUIM_METROS = 150;
const MODOS = [
  { id: "proximos", rotulo: "Perto de mim" },
  { id: "todos", rotulo: "Todos os pontos" },
];

// Por quanto tempo, depois de clicar num ponto do mapa, a lista lateral reajusta a rolagem se o cartão sair da tela.
const JANELA_REFOCO_MS = 4000;

// No desktop a lista rola dentro do painel lateral; no celular quem rola é a página.
const painelRola = (secao) => Boolean(secao) && secao.scrollHeight > secao.clientHeight;

function cartaoVisivel(cartao, secao) {
  const retangulo = cartao.getBoundingClientRect();
  const limites = painelRola(secao) ? secao.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
  return retangulo.top >= limites.top && retangulo.bottom <= limites.bottom;
}

// Rola só o painel (e não os ancestrais, como scrollIntoView faria, deslocando o layout inteiro no desktop).
function centralizarCartao(cartao, secao, suave) {
  const comportamento = suave ? "smooth" : "auto";
  if (!painelRola(secao)) {
    cartao.scrollIntoView({ behavior: comportamento, block: "center" });
    return;
  }
  const alvo = cartao.getBoundingClientRect();
  const painel = secao.getBoundingClientRect();
  secao.scrollBy({ top: alvo.top + alvo.height / 2 - (painel.top + painel.height / 2), behavior: comportamento });
}

const botao = "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-bold transition focus:ring-2 focus:ring-foco focus:outline-none sm:px-4";

// Pontos que já estão no formulário do criador (?parada=...). Só dígitos válidos, sem repetir, até o limite da exibição.
function codigosDaUrl(parametros) {
  return [...new Set(parametros.getAll("parada").map(limparCodigoParada).filter(codigoParadaValido))].slice(0, LIMITE_PONTOS_EXIBICAO);
}

export default function PontosView() {
  const router = useRouter();
  const parametros = useSearchParams();
  // `voltar=configuracao` indica que a pessoa chegou aqui a partir do criador de exibição (e `editar` qual exibição ela edita).
  const [origemCriador] = useState(() => parametros.get("voltar") === "configuracao");
  const [codigoEdicao] = useState(() => parametros.get("editar"));
  const [codigosIniciais] = useState(() => codigosDaUrl(parametros));
  const geo = useGeolocalizacao();
  const [modo, setModo] = useState(codigosIniciais.length ? "todos" : "proximos");
  const [raio, setRaio] = useState(RAIO_PADRAO);
  const [escolhendoManual, setEscolhendoManual] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [pontoFocado, setPontoFocado] = useState(null);
  const [marcados, setMarcados] = useState(() => codigosIniciais.map((codigo) => ({ codigo, nome: "" })));
  const [avisoCriador, setAvisoCriador] = useState("");
  const [criandoTemporaria, setCriandoTemporaria] = useState(false);
  const [erroTemporaria, setErroTemporaria] = useState("");
  const [rolarParaLista, setRolarParaLista] = useState(null);
  const [copiado, setCopiado] = useState(null);
  const [avisoCopia, setAvisoCopia] = useState("");
  const [visao, setVisao] = useState(null);
  const [foco, setFoco] = useState(null);
  const temporizadorRef = useRef(null);
  const areaMapaRef = useRef(null);
  const secaoRef = useRef(null);
  const ultimoFocoRef = useRef(null);
  const global = modo === "todos";
  const proximos = usePontosProximos(global ? null : geo.posicao, raio);
  const area = usePontosNaArea(visao, global);

  useEffect(() => () => window.clearTimeout(temporizadorRef.current), []);

  // Pontos vindos do criador: busca as coordenadas para desenhá-los no mapa e enquadrá-los.
  useEffect(() => {
    if (!API_URL || !codigosIniciais.length) return undefined;
    const controlador = new AbortController();
    criarClienteApi(API_URL)
      .obterPontosPorCodigos(codigosIniciais, { signal: controlador.signal })
      .then(({ pontos: achados = [] }) => {
        setMarcados((atuais) => atuais.map((item) => {
          const ponto = achados.find((achado) => String(achado.codigo) === item.codigo);
          return ponto ? { ...item, nome: ponto.nome, endereco: ponto.endereco, lat: ponto.lat, lng: ponto.lng } : item;
        }));
        const semCadastro = codigosIniciais.filter((codigo) => !achados.some((achado) => String(achado.codigo) === codigo));
        setAvisoCriador(semCadastro.length ? `Não encontramos no mapa: ${semCadastro.join(", ")}. Eles continuam na seleção.` : "");
        if (!achados.length) return;
        const latitudes = achados.map((ponto) => ponto.lat);
        const longitudes = achados.map((ponto) => ponto.lng);
        setFoco({
          id: Date.now(),
          lat: achados[0].lat,
          lng: achados[0].lng,
          zoom: 17,
          limites: achados.length > 1 ? [[Math.min(...latitudes), Math.min(...longitudes)], [Math.max(...latitudes), Math.max(...longitudes)]] : undefined,
        });
      })
      .catch((falha) => {
        if (falha?.name !== "AbortError") setAvisoCriador("Não foi possível mostrar no mapa os pontos do formulário agora.");
      });
    return () => controlador.abort();
  }, [codigosIniciais]);

  // Clique num ponto do mapa: leva a lista lateral até o cartão dele (o destaque já vem do `selecionado`).
  // Depois do clique o mapa se move e a área é consultada de novo, então a lista pode mudar (e empurrar o cartão): por
  // alguns segundos, a cada mudança da lista, confere se o cartão continua inteiro na tela e, se não, volta a centralizá-lo.
  const { pontos: pontosDaArea, carregando: carregandoArea } = area;
  useEffect(() => {
    if (!rolarParaLista) return;
    const cartao = document.getElementById(rolarParaLista.alvo);
    if (!cartao) return;
    const primeira = ultimoFocoRef.current !== rolarParaLista.id;
    if (!primeira && Date.now() - rolarParaLista.id > JANELA_REFOCO_MS) return;
    if (!primeira && cartaoVisivel(cartao, secaoRef.current)) return;
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Os reajustes são instantâneos: uma rolagem suave nova interromperia a anterior.
    centralizarCartao(cartao, secaoRef.current, primeira && !reduzir);
    if (primeira) ultimoFocoRef.current = rolarParaLista.id;
  }, [rolarParaLista, pontosDaArea, carregandoArea, visao]);

  const escolhendo = !global && (escolhendoManual || geo.status === "negada" || geo.status === "indisponivel");
  const imprecisa = geo.posicao?.precisao > PRECISAO_RUIM_METROS;

  function alternarMarca(ponto) {
    setMarcados((atuais) => {
      if (atuais.some((item) => item.codigo === ponto.codigo)) return atuais.filter((item) => item.codigo !== ponto.codigo);
      if (atuais.length >= LIMITE_PONTOS_EXIBICAO) return atuais;
      return [...atuais, { codigo: ponto.codigo, nome: ponto.nome, endereco: ponto.endereco, lat: ponto.lat, lng: ponto.lng }];
    });
  }

  const codigosMarcados = useMemo(() => new Set(marcados.map((ponto) => ponto.codigo)), [marcados]);
  const podeMarcar = marcados.length < LIMITE_PONTOS_EXIBICAO;

  function aoTrocarModo(novo) {
    setModo(novo);
    setEscolhendoManual(false);
    setSelecionado(null);
    setPontoFocado(null);
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
    areaMapaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Ponto que já está na exibição aparece (com todas as opções) na seção "Pontos da exibição"; os demais, na lista de resultados.
  function aoSelecionarNoMapa(codigo) {
    setSelecionado(codigo);
    const jaNaExibicao = marcados.some((ponto) => String(ponto.codigo) === String(codigo));
    setRolarParaLista({ alvo: jaNaExibicao ? `ponto-exibicao-${codigo}` : `ponto-${codigo}`, id: Date.now() });
  }

  function removerMarca(codigo) {
    setMarcados((atuais) => atuais.filter((ponto) => ponto.codigo !== codigo));
  }

  async function aoCriarTemporaria() {
    if (criandoTemporaria || !marcados.length) return;
    setCriandoTemporaria(true);
    setErroTemporaria("");
    try {
      const { exibicao } = await criarClienteApi(API_URL).criarExibicaoTemporaria(marcados.map((ponto) => ponto.codigo));
      router.push(`/exibicao?codigo=${encodeURIComponent(exibicao.codigo)}`);
    } catch (falha) {
      setErroTemporaria(falha?.message || "Não foi possível criar a exibição temporária.");
      setCriandoTemporaria(false);
    }
  }

  function aoIrPara(ponto) {
    if (!ponto) return;
    setSelecionado(ponto.codigo);
    setPontoFocado(ponto);
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

  // Garante que o ponto buscado por texto ou o mais próximo apareça no mapa mesmo que a grade da área ainda não o tenha retornado.
  const pontosNoMapa = useMemo(() => {
    const base = global ? area.pontos : pontos;
    const extras = [];
    // Pontos escolhidos continuam desenhados mesmo quando saem da área consultada.
    marcados.forEach((marcado) => {
      if (typeof marcado.lat === "number" && !base.some((p) => String(p.codigo) === marcado.codigo)) extras.push(marcado);
    });
    if (global && pontoFocado && ![...base, ...extras].some((p) => String(p.codigo) === String(pontoFocado.codigo))) {
      extras.push(pontoFocado);
    }
    if (!global && !base.length && maisProximo) {
      extras.push(maisProximo);
    }
    return extras.length ? [...base, ...extras] : base;
  }, [global, area.pontos, pontos, pontoFocado, maisProximo, marcados]);

  let resumo = "";
  if (geo.status === "solicitando") resumo = "Obtendo sua localização...";
  else if (escolhendo && !geo.posicao) resumo = "Toque no mapa para escolher o local da busca.";
  else if (carregando) resumo = "Buscando pontos...";
  else if (consultou) resumo = pontos.length ? `${pontos.length} ${pontos.length === 1 ? "ponto encontrado" : "pontos encontrados"} em até ${raio} m.` : `Nenhum ponto em até ${raio} m.`;

  const proximoRaio = RAIOS.find((valor) => valor > raio);
  const aproximarMapa = global && !visaoPermiteBusca(visao);

  return (
    <main className="flex min-h-[calc(100dvh-68px)] w-full max-w-full flex-col overflow-x-hidden bg-superficie-alt lg:h-[calc(100dvh-68px)] lg:flex-row lg:overflow-hidden">
      <section ref={secaoRef} aria-labelledby="titulo-pontos" className={`flex w-full min-w-0 flex-col gap-4 p-4 lg:w-[26rem] lg:shrink-0 lg:overflow-y-auto ${marcados.length ? "pb-56" : "pb-8"}`}>
        <div>
          <h1 id="titulo-pontos" className="text-xl font-extrabold text-texto sm:text-2xl">{global ? "Todos os pontos" : "Pontos perto de você"}</h1>
          <p className="mt-1 text-sm text-texto-suave">Encontre o código de um ponto de ônibus para criar sua exibição.</p>
        </div>

        {origemCriador ? (
          <div className="flex flex-col gap-2 rounded-md border border-borda-forte bg-superficie p-3 text-sm text-texto">
            <p>Você está escolhendo pontos para o criador de exibição. Os do formulário aparecem marcados no mapa.</p>
            <Link href={montarHrefCriador(marcados, { origemCriador, codigoEdicao })} className="flex w-fit items-center gap-1.5 font-bold underline focus:ring-2 focus:ring-foco focus:outline-none">
              <ArrowLeft size={16} aria-hidden="true" />
              Voltar ao criador de exibição
            </Link>
            {avisoCriador ? <p role="status" className="text-texto-suave">{avisoCriador}</p> : null}
          </div>
        ) : null}

        <div role="group" aria-label="Modo de busca" className="grid grid-cols-2 gap-2">
          {MODOS.map((opcao) => (
            <button key={opcao.id} type="button" onClick={() => aoTrocarModo(opcao.id)} aria-pressed={modo === opcao.id} className={`${botao} border ${modo === opcao.id ? "border-marca bg-marca text-sobre-marca" : "border-borda-forte bg-superficie text-texto hover:bg-superficie-forte"}`}>
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
            <button type="button" onClick={() => setEscolhendoManual((atual) => !atual)} aria-pressed={escolhendo} disabled={geo.status === "negada" || geo.status === "indisponivel"} className={`${botao} border border-borda-forte bg-superficie text-texto hover:bg-superficie-forte aria-pressed:bg-superficie-forte disabled:opacity-50`}>
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

        {marcados.length ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-texto">
              {origemCriador ? "Pontos da exibição" : "Pontos selecionados"} ({marcados.length} de {LIMITE_PONTOS_EXIBICAO})
            </h2>
            <ol aria-label={origemCriador ? "Pontos da exibição" : "Pontos selecionados"} className="flex flex-col gap-3">
              {marcados.map((ponto) => (
                <li key={ponto.codigo}>
                  <CartaoPonto
                    ponto={ponto}
                    idCartao={`ponto-exibicao-${ponto.codigo}`}
                    selecionado={String(selecionado) === ponto.codigo}
                    copiado={copiado === ponto.codigo}
                    marcado
                    podeMarcar={podeMarcar}
                    onAlternarMarca={alternarMarca}
                    onRemover={removerMarca}
                    onSelecionar={(codigo) => (typeof ponto.lat === "number" ? aoIrPara(ponto) : aoSelecionar(codigo))}
                    onCopiar={aoCopiar}
                  />
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {global ? (
          <PainelGlobal area={area} visao={visao} posicao={geo.posicao} selecionado={selecionado} copiado={copiado} marcados={codigosMarcados} podeMarcar={podeMarcar} onAlternarMarca={alternarMarca} onSelecionar={aoSelecionar} onCopiar={aoCopiar} onIrPara={aoIrPara} />
        ) : (
          <>
            <fieldset className="lg:hidden">
              <legend className="mb-1 text-sm font-semibold text-texto-suave">Distância da busca</legend>
              <div className="grid grid-cols-3 gap-2">
                {RAIOS.map((valor) => (
                  <label key={valor} className={`flex cursor-pointer items-center justify-center rounded-md border px-2 py-2 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foco ${raio === valor ? "border-marca bg-marca text-sobre-marca contraste:border-acento contraste:bg-acento contraste:text-superficie" : "border-borda-forte bg-superficie text-texto"}`}>
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
                    <CartaoPonto
                      ponto={maisProximo}
                      selecionado={selecionado === maisProximo.codigo}
                      copiado={copiado === maisProximo.codigo}
                      marcado={codigosMarcados.has(maisProximo.codigo)}
                      podeMarcar={podeMarcar}
                      onAlternarMarca={alternarMarca}
                      onSelecionar={() => aoSelecionar(maisProximo.codigo)}
                      onCopiar={aoCopiar}
                    />
                  </>
                ) : (
                  <p className="text-sm text-texto-suave">Não encontramos pontos por aqui. Confira se o local escolhido está em São Paulo.</p>
                )}
                {proximoRaio ? (
                  <button type="button" onClick={() => setRaio(proximoRaio)} className={`${botao} border border-borda-forte bg-superficie text-texto hover:bg-superficie-forte`}>Ampliar a busca para {proximoRaio} m</button>
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

      <div ref={areaMapaRef} className="relative order-first h-[38dvh] min-h-[240px] max-h-[340px] w-full shrink-0 lg:order-none lg:h-auto lg:max-h-none lg:flex-1">
        {aproximarMapa ? (
          <p className="pointer-events-none absolute top-3 left-1/2 z-[1000] w-max max-w-[calc(100%-5rem)] -translate-x-1/2 rounded-full bg-superficie px-3 py-1.5 text-center text-xs font-bold text-texto shadow-lg sm:px-4 sm:py-2 sm:text-sm">
            Aproxime o mapa para ver os pontos
          </p>
        ) : null}
        <PontosMapa
          centro={geo.posicao}
          precisao={geo.posicao?.precisao}
          raio={global ? null : raio}
          pontos={pontosNoMapa}
          selecionado={selecionado}
          onSelecionar={aoSelecionarNoMapa}
          marcados={codigosMarcados}
          escolhendo={escolhendo}
          onEscolherLocal={aoEscolherLocal}
          foco={foco}
          onVisaoMudou={setVisao}
        />

        {!global && (
          <fieldset className="absolute bottom-5 left-1/2 z-[1000] hidden -translate-x-1/2 rounded-xl border border-borda bg-superficie p-3 shadow-lg lg:block">
            <div className="mb-2 text-sm font-semibold text-texto-suave">
              Distância da busca
            </div>

            <div className="flex gap-2">
              {RAIOS.map((valor) => (
                <label
                  key={valor}
                  className={`flex cursor-pointer items-center justify-center rounded-md border px-6 py-2 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foco ${raio === valor
                    ? "border-marca bg-marca text-sobre-marca hover:brightness-90 contraste:border-acento contraste:bg-acento contraste:text-superficie"
                    : "border-borda-forte bg-superficie text-texto hover:bg-superficie-alt"
                    }`}
                >
                  <input
                    type="radio"
                    name="raio-desktop"
                    value={valor}
                    checked={raio === valor}
                    onChange={() => setRaio(valor)}
                    className="sr-only"
                  />
                  {valor} m
                </label>
              ))}
            </div>
          </fieldset>
        )}

      </div>
      <BarraSelecao
        marcados={marcados}
        limite={LIMITE_PONTOS_EXIBICAO}
        onRemover={removerMarca}
        onLimpar={() => setMarcados([])}
        origemCriador={origemCriador}
        codigoEdicao={codigoEdicao}
        onCriarTemporaria={API_URL ? aoCriarTemporaria : undefined}
        criandoTemporaria={criandoTemporaria}
        erroTemporaria={erroTemporaria}
      />
    </main>
  );
}