"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Save, Info, MapPin } from "lucide-react";
import { LIMITE_PARADAS_EXIBICAO, codigoParadaValido, limparCodigoParada } from "@busca-bus/core";
import { criarClienteApi } from "@busca-bus/core/cliente";
import InstituicaoSelect from "@/components/ui/InstituicaoSelect";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmarSalvamentoModal from "@/components/configuracao/ConfirmarSalvamentoModal";
import InlineToast from "@/components/ui/InlineToast";
import { limparRascunho, lerRascunho, salvarRascunho } from "@/lib/rascunhoExibicao";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const LIMITE_NOME_EXIBICAO = 25;
const PADRAO = {
  nome: "",
  instituicao: "",
  semInstituicao: false,
  atraso: 1,
  adiantado: 1,
  distancia: 20,
  permitirMultiplosPorLinha: false,
  token: "",
  paradas: [""],
};

function camposDoRascunho(rascunho) {
  return {
    nome: String(rascunho.nome ?? ""),
    instituicao: rascunho.instituicao ?? "",
    semInstituicao: Boolean(rascunho.semInstituicao),
    atraso: Number(rascunho.atraso) || PADRAO.atraso,
    adiantado: Number(rascunho.adiantado) || PADRAO.adiantado,
    distancia: Number(rascunho.distancia) || PADRAO.distancia,
    permitirMultiplosPorLinha: Boolean(rascunho.permitirMultiplosPorLinha),
    ...(Array.isArray(rascunho.paradas) && rascunho.paradas.length ? { paradas: rascunho.paradas.map(String) } : {}),
  };
}

function converterExibicao(exibicao) {
  return {
    nome: exibicao.nome || exibicao.nome_exibicao || "",
    instituicao: exibicao.instituicaoId || exibicao.instituicao || "",
    semInstituicao: !(exibicao.instituicaoId || exibicao.instituicao),
    atraso: exibicao.config?.tempoAtraso ?? exibicao.config?.tempo_atraso ?? 1,
    adiantado: exibicao.config?.tempoAdiantado ?? exibicao.config?.tempo_adiantado ?? 1,
    distancia: exibicao.config?.distanciaMaxMin ?? exibicao.config?.distanciaMinOnibus ?? 20,
    permitirMultiplosPorLinha: Boolean(exibicao.config?.permitirMultiplosPorLinha),
    paradas: exibicao.paradas || exibicao.codigos_parada || [""],
  };
}

export default function ConfiguracaoForm({ codigo, paradasIniciais = [], usarRascunho = false }) {
  const router = useRouter();
  const [toasts, setToasts] = useState([]);
  const { usuario, accessToken, estaLogado, carregando } = useAuth();
  const existente = null;
  // Volta do mapa (/pontos): restaura o que já estava digitado, desde que seja da mesma exibição (ou de uma nova).
  const [rascunho] = useState(() => {
    const salvo = usarRascunho ? lerRascunho() : null;
    return salvo && (salvo.codigo ?? null) === (codigo ?? null) ? salvo : null;
  });
  const [formulario, setFormulario] = useState(() => ({
    ...PADRAO,
    ...(existente ? converterExibicao(existente) : {}),
    ...(rascunho ? camposDoRascunho(rascunho) : {}),
    instituicao: usuario?.fac_id || existente?.instituicao || "",
    semInstituicao: !(usuario?.fac_id || existente?.instituicao),
    token: API_URL ? "" : "mock-sptrans-token",
    ...(paradasIniciais.length && !existente ? { paradas: paradasIniciais } : {}),
  }));
  const [mensagem, setMensagem] = useState("");
  const [salvamento, setSalvamento] = useState(null);
  const [mostrarAjudaCodigo, setMostrarAjudaCodigo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  // O estado só atualiza no próximo render; a ref barra um segundo envio disparado antes disso (duplo clique, Enter repetido).
  const salvandoRef = useRef(false);
  // Códigos que vieram de fora (página /pontos) já aparecem marcados se forem inválidos, sem esperar o clique em Salvar.
  const [errosParadas, setErrosParadas] = useState(() => paradasIniciais.map((parada, indice) => (codigoParadaValido(parada) ? null : indice)).filter((indice) => indice !== null));
  const [carregandoDados, setCarregandoDados] = useState(Boolean(API_URL && (codigo || accessToken)));


  function adicionarToast(texto, cor = "") {
    const id = Date.now() + Math.random();

    setToasts((atuais) => [
      ...atuais,
      { id, texto, cor, saindo: false },
    ]);

    setTimeout(() => {
      setToasts((atuais) =>
        atuais.map((toast) =>
          toast.id === id ? { ...toast, saindo: true } : toast
        )
      );
    }, 3000);

    setTimeout(() => {
      setToasts((atuais) =>
        atuais.filter((toast) => toast.id !== id)
      );
    }, 3700);
  }



  useEffect(() => {
    if (!mensagem) return;

    const timeout = setTimeout(() => {
      setMensagem("");
    }, 3500);

    return () => clearTimeout(timeout);
  }, [mensagem]);


  useEffect(() => {
    if (!API_URL || !accessToken) {
      setCarregandoDados(false);
      return undefined;
    }
    setCarregandoDados(true);
    const cliente = criarClienteApi(API_URL);
    let cancelado = false;
    async function carregarDados() {
      try {
        const [dadosToken, dadosExibicao] = await Promise.all([
          cliente.obterTokenSptrans(accessToken),
          codigo ? cliente.obterExibicao(codigo) : Promise.resolve(null),
        ]);
        if (cancelado) return;
        setFormulario((atual) => ({
          ...atual,
          token: dadosToken.token || "",
          // Com rascunho (volta do mapa) o que a pessoa já alterou vale mais do que a versão salva no servidor.
          ...(dadosExibicao?.exibicao && !rascunho ? converterExibicao(dadosExibicao.exibicao) : {}),
        }));
      } catch (error) {
        if (!cancelado) setMensagem("Não foi possível carregar a configuração.");
      } finally {
        if (!cancelado) setCarregandoDados(false);
      }
    }
    carregarDados();
    return () => {
      cancelado = true;
    };
  }, [accessToken, codigo, rascunho]);

  if (carregando || carregandoDados) return null;
  if (!estaLogado) return <div className="mx-auto mt-12 max-w-2xl rounded-xl bg-superficie p-10 text-center shadow"><h1 className="text-2xl font-bold">Faça login para configurar uma exibição</h1><Link href="/login" className="mt-6 inline-block rounded-md bg-marca px-6 py-3 font-bold text-sobre-marca">Entrar</Link></div>;

  function atualizar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarParada(indice, valor) {
    setFormulario((atual) => ({
      ...atual,
      paradas: atual.paradas.map((parada, i) => i === indice ? limparCodigoParada(valor) : parada),
    }));
  }

  async function salvar(evento) {
    evento.preventDefault();
    if (salvandoRef.current) return;
    if (formulario.nome.length > LIMITE_NOME_EXIBICAO) {
      return setMensagem(`O nome da exibição deve ter no máximo ${LIMITE_NOME_EXIBICAO} caracteres.`);
    }
    const paradasVazias = formulario.paradas.map((parada, indice) => parada.trim() ? null : indice).filter((indice) => indice !== null);
    const indicesInvalidos = formulario.paradas.map((parada, indice) => parada && !codigoParadaValido(parada) ? indice : null).filter((indice) => indice !== null);
    const indicesDuplicados = formulario.paradas.reduce((indices, parada, indice, todas) => {
      if (parada && todas.indexOf(parada) !== indice) indices.push(indice);
      return indices;
    }, []);
    setErrosParadas([...paradasVazias, ...indicesInvalidos, ...indicesDuplicados]);
    if (!formulario.token.trim()) {
      adicionarToast("O token da API é obrigatório.", "border-erro text-erro");
      return;
    }
    if (paradasVazias.length) {
      return setMensagem("Preencha todos os códigos de ponto ou remova os campos vazios.");
    }
    if (indicesInvalidos.length) {
      return setMensagem("Os códigos de ponto devem ter de 1 a 9 dígitos (só números).");
    }
    if (indicesDuplicados.length) {
      return setMensagem("Não é permitido repetir o mesmo código de ponto.");
    }
    const paradasValidas = formulario.paradas;
    if (API_URL && !accessToken) return setMensagem("Sua sessão expirou. Entre novamente.");
    salvandoRef.current = true;
    setSalvando(true);
    try {
      if (API_URL) {
        const cliente = criarClienteApi(API_URL);
        await cliente.atualizarTokenSptrans(formulario.token.trim(), accessToken);
        const dados = {
          nome: formulario.nome,
          instituicaoId: formulario.semInstituicao ? null : formulario.instituicao || null,
          paradas: paradasValidas,
          config: {
            tempoAtraso: formulario.atraso,
            tempoAdiantado: formulario.adiantado,
            distanciaMaxMin: formulario.distancia,
            permitirMultiplosPorLinha: formulario.permitirMultiplosPorLinha,
          },
        };
        const resposta = codigo
          ? await cliente.atualizarExibicao(codigo, dados, accessToken)
          : await cliente.criarExibicao(dados, accessToken);
        const codigoCriado = resposta.exibicao.codigo;
        limparRascunho();
        adicionarToast(
          codigo ? "Configuração atualizada com sucesso!" : "Configuração salva com sucesso!"
        );

        setSalvamento({ codigo: codigoCriado, atualizado: Boolean(codigo) });
        return;
      }
      const destino = `/exibicao?codigo=${encodeURIComponent(codigo || "Nova01")}`;
      setMensagem(codigo ? "Exibição atualizada com sucesso!" : "Exibição criada com sucesso!");
      adicionarToast(
        codigo ? "Configuração atualizada com sucesso!" : "Configuração salva com sucesso!"
      );
      setSalvamento({ codigo: codigo || "Nova01", atualizado: Boolean(codigo), destino });
    } catch (error) {
      if (error.codigo === "REDE") {
        adicionarToast("Não foi possível conectar ao servidor.", "border-erro text-erro");
      } else if (error.status === 401 || error.status === 403) {
        adicionarToast("Sua sessão expirou ou você não tem permissão.", "border-erro text-erro");
      } else {
        adicionarToast(
          error.message || "Não foi possível salvar a configuração.",
          "border-erro text-erro"
        );
      }
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
    }
  }

  function adicionar() {
    if (formulario.paradas.length < LIMITE_PARADAS_EXIBICAO) {
      atualizar("paradas", [...formulario.paradas, ""]);
      adicionarToast("Ponto adicionado com sucesso!");
    }
  }

  // Remove só o campo escolhido; os erros dos campos seguintes descem uma posição junto com eles.
  function remover(indice) {
    if (formulario.paradas.length <= 1) return;
    atualizar("paradas", formulario.paradas.filter((_, i) => i !== indice));
    setErrosParadas((atuais) => atuais.filter((item) => item !== indice).map((item) => (item > indice ? item - 1 : item)));
    adicionarToast("Ponto removido com sucesso!");
    // O botão clicado some: devolve o foco ao campo que ocupou o lugar (ou ao anterior, se era o último).
    const destino = Math.min(indice, formulario.paradas.length - 2);
    window.requestAnimationFrame(() => document.getElementById(`parada-${destino}`)?.focus());
  }

  // Leva os pontos já digitados para o mapa e guarda o resto do formulário para a volta.
  function irParaMapa() {
    salvarRascunho({
      codigo: codigo ?? null,
      nome: formulario.nome,
      instituicao: formulario.instituicao,
      semInstituicao: formulario.semInstituicao,
      atraso: formulario.atraso,
      adiantado: formulario.adiantado,
      distancia: formulario.distancia,
      permitirMultiplosPorLinha: formulario.permitirMultiplosPorLinha,
      paradas: formulario.paradas,
    });
  }
  const hrefMapa = (() => {
    const parametros = new URLSearchParams([["voltar", "configuracao"]]);
    if (codigo) parametros.set("editar", codigo);
    formulario.paradas.filter(codigoParadaValido).forEach((parada) => parametros.append("parada", parada));
    return `/pontos?${parametros}`;
  })();

  return (
    <div className="relative mx-2 my-4 w-auto max-w-4xl rounded-xl border border-borda bg-superficie p-4 shadow-2xl sm:mx-auto sm:my-8 sm:p-10">
      <InlineToast mensagens={toasts} />
      <h1 className="mb-8 text-center text-2xl font-bold text-texto sm:text-3xl">
        Configuração
      </h1>

      <Link
        href="/"
        className="absolute top-4 left-4 inline-flex cursor-pointer items-center gap-1 text-sm text-texto transition hover:text-destaque hover:underline sm:top-12 sm:left-6"
      >
        ← Voltar
      </Link>

      <form onSubmit={salvar}>
        <div className="mb-6">
          <label
            htmlFor="nomeExib"
            className="mb-2 block text-sm font-medium text-texto-suave"
          >
            Nome da exibição (Opcional)
          </label>

          <input
            id="nomeExib"
            value={formulario.nome}
            maxLength={LIMITE_NOME_EXIBICAO}
            onChange={(e) => atualizar("nome", e.target.value)}
            placeholder="exemplo: Fatec-ZL"
            className="w-full rounded-md border border-borda px-4 py-3 text-lg focus:ring-2 focus:ring-foco focus:outline-none"
          />

          <p className="mt-1 text-xs text-texto-mudo">
            Máximo de {LIMITE_NOME_EXIBICAO} caracteres.
          </p>
        </div>

        <InstituicaoSelect
          instituicao={formulario.instituicao}
          semInstituicao={formulario.semInstituicao}
          onChange={(alteracoes) =>
            setFormulario((atual) => ({ ...atual, ...alteracoes }))
          }
        />

        <div className="flex flex-wrap justify-center gap-3.5">
          <NumberField
            label="Tolerância atraso (1–5 min)"
            value={formulario.atraso}
            min={1}
            max={5}
            onChange={(valor) => atualizar("atraso", valor)}
          />

          <NumberField
            label="Tolerância adiantado (1–5 min)"
            value={formulario.adiantado}
            min={1}
            max={5}
            onChange={(valor) => atualizar("adiantado", valor)}
          />

          <NumberField
            label="Distância máxima (5-60 min)"
            value={formulario.distancia}
            min={5}
            max={60}
            onChange={(valor) => atualizar("distancia", valor)}
          />
        </div>

        <label className="mb-8 flex cursor-pointer items-start gap-3 border-t border-borda-suave pt-6 text-sm text-texto-suave">
          <input
            type="checkbox"
            checked={formulario.permitirMultiplosPorLinha}
            onChange={(e) =>
              atualizar("permitirMultiplosPorLinha", e.target.checked)
            }
            className="mt-1 cursor-pointer"
          />

          <span>
            <strong>Exibir vários ônibus da mesma linha</strong>
            <br />
            <span className="text-xs text-texto-mudo">
              Desativado por padrão: mostra no máximo um ônibus por código de linha.
            </span>
          </span>
        </label>

        <div className="mb-8 border-t border-borda-suave pt-6">
          <label
            htmlFor="tokenApi"
            className="mb-2 block text-sm font-bold text-erro-forte"
          >
            🔑 Token da API Olho Vivo (SPTrans)
          </label>

          <input
            id="tokenApi"
            value={formulario.token}
            onChange={(e) => atualizar("token", e.target.value)}
            placeholder="Cole seu token aqui..."
            className="w-full rounded-md border border-borda px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-foco focus:outline-none"
          />

          <p className="mt-2 text-xs text-texto-mudo">
            Obrigatório. O token é armazenado no seu usuário.
          </p>
        </div>

        <div>
          <div className="relative mb-2 flex justify-between text-sm font-medium text-texto-suave">
            <label>Código do ponto de ônibus</label>

            <div className="flex items-center gap-4">
              <Link
                href={hrefMapa}
                onClick={irParaMapa}
                className="flex cursor-pointer items-center gap-1 underline transition hover:text-destaque"
              >
                <MapPin size={16} aria-hidden="true" />
                Escolher no mapa
              </Link>
              <button
                type="button"
                onClick={() => setMostrarAjudaCodigo((atual) => !atual)}
                className="cursor-pointer underline transition hover:text-destaque"
              >
                Onde achar o código
              </button>
            </div>
            {mostrarAjudaCodigo && (
              <div className="absolute right-0 bottom-full z-50 mb-2 w-80 rounded-xl border border-borda bg-superficie p-4 text-justify text-sm leading-relaxed font-normal text-texto shadow-xl">
                <div className="mb-3 flex items-center gap-2 text-left font-semibold">
                  <Info size={18} className="shrink-0 text-destaque" />
                  Onde encontrar o código?
                </div>

                <p>
                  Você pode encontrar o código do ponto no folheto colado ao totem indicativo de parada.
                </p>

                <p className="mt-2">
                  Acima das informações do folheto, procure um número grande. Esse é o código do ponto que você deve informar no Busca-Bus.
                </p>
              </div>
            )}
          </div>

          {formulario.paradas.map((parada, indice) => {
            const duplicado =
              parada &&
              formulario.paradas.indexOf(parada) !==
              formulario.paradas.lastIndexOf(parada);

            return (
              <div key={indice}>
                <div className="flex items-start gap-2">
                <input
                  id={`parada-${indice}`}
                  aria-label={`Código do ponto ${indice + 1}`}
                  aria-invalid={errosParadas.includes(indice)}
                  value={parada}
                  onChange={(e) => {
                    atualizarParada(indice, e.target.value);
                    setErrosParadas((atuais) =>
                      atuais.filter((item) => item !== indice)
                    );
                  }}
                  placeholder="exemplo: 650004840"
                  inputMode="numeric"
                  className={`mb-2 min-w-0 flex-1 rounded-md border px-4 py-3 text-lg focus:ring-2 focus:ring-foco focus:outline-none ${errosParadas.includes(indice)
                    ? "border-erro bg-erro/10"
                    : "border-borda"
                    }`}
                />
                <button
                  type="button"
                  disabled={formulario.paradas.length <= 1}
                  onClick={() => remover(indice)}
                  aria-label={`Remover o ponto ${indice + 1}`}
                  className="mb-2 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-borda px-3 py-3.5 text-sm text-texto-suave transition hover:border-erro hover:text-erro focus:ring-2 focus:ring-foco focus:outline-none disabled:cursor-not-allowed disabled:text-texto-desabilitado disabled:hover:border-borda disabled:hover:text-texto-desabilitado"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Remover</span>
                </button>
                </div>

                {errosParadas.includes(indice) && (
                  <p className="mb-2 text-sm text-erro">
                    {duplicado
                      ? "Este código de ponto está repetido."
                      : "Informe um código com 1 a 9 dígitos (só números)."}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            disabled={formulario.paradas.length >= LIMITE_PARADAS_EXIBICAO}
            onClick={adicionar}
            className="flex cursor-pointer items-center gap-2 font-roboto-mono text-sm italic transition hover:text-destaque hover:underline disabled:cursor-not-allowed disabled:text-texto-desabilitado disabled:no-underline sm:text-base"
          >
            <Plus />Adicionar
          </button>

          <button
            type="submit"
            disabled={salvando}
            aria-busy={salvando}
            className="flex cursor-pointer items-center gap-2 font-roboto-mono italic transition hover:text-acento hover:underline disabled:cursor-not-allowed disabled:text-texto-desabilitado disabled:no-underline"
          >
            <Save />{salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>

        <p
          className={`mt-5 text-center font-semibold text-acento transition-opacity duration-1000 ${mensagem ? "opacity-100" : "opacity-0"
            }`}
        >
          {mensagem || "\u00A0"}
        </p>
      </form>

      <ConfirmarSalvamentoModal
        aberto={Boolean(salvamento)}
        atualizado={salvamento?.atualizado}
        codigo={salvamento?.codigo}
        onClose={() => setSalvamento(null)}
        onAcessar={() =>
          router.push(
            salvamento?.destino ||
            `/exibicao?codigo=${encodeURIComponent(salvamento?.codigo || "")}`
          )
        }
      />
    </div>
  );

}

function NumberField({ label, value, min, max, onChange }) {
  return (
    <div className="mb-6 flex w-full max-w-56 flex-col items-center">
      <label className="mb-2 text-center text-sm font-medium text-texto-suave">
        {label}
      </label>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) =>
          onChange(Math.min(max, Math.max(min, Number(e.target.value))))
        }
        className="w-32 rounded-md border border-borda px-3 py-2 text-center text-lg focus:ring-2 focus:ring-foco focus:outline-none"
      />
    </div>
  );
}

