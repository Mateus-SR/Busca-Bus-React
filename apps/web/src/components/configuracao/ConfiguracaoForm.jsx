"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Minus, Plus, Save } from "lucide-react";
import { criarClienteApi } from "@busca-bus/core/cliente";
import InstituicaoSelect from "@/components/ui/InstituicaoSelect";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmarSalvamentoModal from "@/components/configuracao/ConfirmarSalvamentoModal";

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

export default function ConfiguracaoForm({ codigo, paradaInicial }) {
  const router = useRouter();
  const { usuario, accessToken, estaLogado, carregando } = useAuth();
  const existente = null;
  const [formulario, setFormulario] = useState(() => ({
    ...PADRAO,
    ...(existente ? converterExibicao(existente) : {}),
    instituicao: usuario?.fac_id || existente?.instituicao || "",
    semInstituicao: !(usuario?.fac_id || existente?.instituicao),
    token: API_URL ? "" : "mock-sptrans-token",
    ...(paradaInicial && !existente ? { paradas: [paradaInicial] } : {}),
  }));
  const [mensagem, setMensagem] = useState("");
  const [salvamento, setSalvamento] = useState(null);
  // Um código que veio de fora (página /pontos) já aparece marcado se não tiver 7 ou 9 dígitos, sem esperar o clique em Salvar.
  const [errosParadas, setErrosParadas] = useState(() => (paradaInicial && ![7, 9].includes(paradaInicial.length) ? [0] : []));
  const [carregandoDados, setCarregandoDados] = useState(Boolean(API_URL && (codigo || accessToken)));

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
          ...(dadosExibicao?.exibicao ? converterExibicao(dadosExibicao.exibicao) : {}),
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
  }, [accessToken, codigo]);

  if (carregando || carregandoDados) return null;
  if (!estaLogado) return <div className="mx-auto mt-12 max-w-2xl rounded-xl bg-superficie p-10 text-center shadow"><h1 className="text-2xl font-bold">Faça login para configurar uma exibição</h1><Link href="/login" className="mt-6 inline-block rounded-md bg-marca px-6 py-3 font-bold text-sobre-marca">Entrar</Link></div>;

  function atualizar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarParada(indice, valor) {
    setFormulario((atual) => ({
      ...atual,
      paradas: atual.paradas.map((parada, i) => i === indice ? valor.replace(/\D/g, "").slice(0, 9) : parada),
    }));
  }

  async function salvar(evento) {
    evento.preventDefault();
    if (formulario.nome.length > LIMITE_NOME_EXIBICAO) {
      return setMensagem(`O nome da exibição deve ter no máximo ${LIMITE_NOME_EXIBICAO} caracteres.`);
    }
    const paradasVazias = formulario.paradas.map((parada, indice) => parada.trim() ? null : indice).filter((indice) => indice !== null);
    const indicesInvalidos = formulario.paradas.map((parada, indice) => parada && ![7, 9].includes(parada.length) ? indice : null).filter((indice) => indice !== null);
    const indicesDuplicados = formulario.paradas.reduce((indices, parada, indice, todas) => {
      if (parada && todas.indexOf(parada) !== indice) indices.push(indice);
      return indices;
    }, []);
    setErrosParadas([...paradasVazias, ...indicesInvalidos, ...indicesDuplicados]);
    if (!formulario.token.trim()) return setMensagem("Token da API é obrigatório.");
    if (paradasVazias.length) {
      return setMensagem("Preencha todos os códigos de ponto ou remova os campos vazios.");
    }
    if (indicesInvalidos.length) {
      return setMensagem("Os códigos de ponto devem ter 7 ou 9 dígitos.");
    }
    if (indicesDuplicados.length) {
      return setMensagem("Não é permitido repetir o mesmo código de ponto.");
    }
    const paradasValidas = formulario.paradas;
    if (API_URL && !accessToken) return setMensagem("Sua sessão expirou. Entre novamente.");
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
        setSalvamento({ codigo: codigoCriado, atualizado: Boolean(codigo) });
        return;
      }
      const destino = `/exibicao?codigo=${encodeURIComponent(codigo || "Nova01")}`;
      setMensagem(codigo ? "Exibição atualizada com sucesso!" : "Exibição criada com sucesso!");
      setSalvamento({ codigo: codigo || "Nova01", atualizado: Boolean(codigo), destino });
    } catch (error) {
      setMensagem("Não foi possível salvar a exibição.");
    }
  }

  function adicionar() {
    if (formulario.paradas.length < 5) atualizar("paradas", [...formulario.paradas, ""]);
  }

  function remover() {
    if (formulario.paradas.length > 1) atualizar("paradas", formulario.paradas.slice(0, -1));
  }

  return <div className="relative mx-2 my-4 w-auto max-w-4xl rounded-xl border border-borda bg-superficie p-4 shadow-2xl sm:mx-auto sm:my-8 sm:p-10"><h1 className="mb-8 text-center text-2xl font-bold text-texto sm:text-3xl">Configuração</h1><Link href="/" className="absolute top-4 left-4 text-sm text-texto transition hover:text-destaque sm:top-12 sm:left-6">← Voltar</Link><form onSubmit={salvar}>
    <div className="mb-6"><label htmlFor="nomeExib" className="mb-2 block text-sm font-medium text-texto-suave">Nome da exibição (Opcional)</label><input id="nomeExib" value={formulario.nome} maxLength={LIMITE_NOME_EXIBICAO} onChange={(e) => atualizar("nome", e.target.value)} placeholder="exemplo: Fatec-ZL" className="w-full rounded-md border border-borda px-4 py-3 text-lg focus:ring-2 focus:ring-foco focus:outline-none" /><p className="mt-1 text-xs text-texto-mudo">Máximo de {LIMITE_NOME_EXIBICAO} caracteres.</p></div>
    <InstituicaoSelect instituicao={formulario.instituicao} semInstituicao={formulario.semInstituicao} onChange={(alteracoes) => setFormulario((atual) => ({ ...atual, ...alteracoes }))} />
    <div className="flex flex-wrap justify-center gap-3.5"><NumberField label="Tolerância atraso (1–5 min)" value={formulario.atraso} min={1} max={5} onChange={(valor) => atualizar("atraso", valor)} /><NumberField label="Tolerância adiantado (1–5 min)" value={formulario.adiantado} min={1} max={5} onChange={(valor) => atualizar("adiantado", valor)} /><NumberField label="Distância máxima (5-60 min)" value={formulario.distancia} min={5} max={60} onChange={(valor) => atualizar("distancia", valor)} /></div>
    <label className="mb-8 flex items-start gap-3 border-t border-borda-suave pt-6 text-sm text-texto-suave"><input type="checkbox" checked={formulario.permitirMultiplosPorLinha} onChange={(e) => atualizar("permitirMultiplosPorLinha", e.target.checked)} className="mt-1" /><span><strong>Exibir vários ônibus da mesma linha</strong><br /><span className="text-xs text-texto-mudo">Desativado por padrão: mostra no máximo um ônibus por código de linha.</span></span></label>
    <div className="mb-8 border-t border-borda-suave pt-6"><label htmlFor="tokenApi" className="mb-2 block text-sm font-bold text-erro-forte">🔑 Token da API Olho Vivo (SPTrans)</label><input id="tokenApi" value={formulario.token} onChange={(e) => atualizar("token", e.target.value)} placeholder="Cole seu token aqui..." className="w-full rounded-md border border-borda px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-foco focus:outline-none" /><p className="mt-2 text-xs text-texto-mudo">Obrigatório. O token é armazenado no seu usuário.</p></div>
    <div><div className="mb-2 flex justify-between text-sm font-medium text-texto-suave"><label>Código do ponto de ônibus</label><span className="underline">Onde achar o código</span></div>{formulario.paradas.map((parada, indice) => { const duplicado = parada && formulario.paradas.indexOf(parada) !== formulario.paradas.lastIndexOf(parada); return <div key={indice}><input aria-invalid={errosParadas.includes(indice)} value={parada} onChange={(e) => { atualizarParada(indice, e.target.value); setErrosParadas((atuais) => atuais.filter((item) => item !== indice)); }} placeholder="exemplo: 650004840" inputMode="numeric" className={`mb-2 w-full rounded-md border px-4 py-3 text-lg focus:ring-2 focus:ring-foco focus:outline-none ${errosParadas.includes(indice) ? "border-erro bg-erro/10" : "border-borda"}`} />{errosParadas.includes(indice) && <p className="mb-2 text-sm text-erro">{duplicado ? "Este código de ponto está repetido." : "Informe um código com 7 ou 9 dígitos."}</p>}</div>; })}</div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-4"><div className="flex gap-5 sm:gap-10"><button type="button" disabled={formulario.paradas.length >= 5} onClick={adicionar} className="flex items-center gap-2 font-roboto-mono text-sm italic disabled:cursor-not-allowed disabled:text-texto-desabilitado sm:text-base"><Plus />Adicionar</button><button type="button" disabled={formulario.paradas.length <= 1} onClick={remover} className="flex items-center gap-2 font-roboto-mono text-sm italic disabled:cursor-not-allowed disabled:text-texto-desabilitado sm:text-base"><Minus />Remover</button></div><button type="submit" className="flex items-center gap-2 font-roboto-mono italic hover:text-acento"><Save />Salvar</button></div>
    {mensagem && <p className="mt-5 text-center font-semibold text-acento">{mensagem}</p>}
  </form><ConfirmarSalvamentoModal aberto={Boolean(salvamento)} atualizado={salvamento?.atualizado} codigo={salvamento?.codigo} onClose={() => setSalvamento(null)} onAcessar={() => router.push(salvamento?.destino || `/exibicao?codigo=${encodeURIComponent(salvamento?.codigo || "")}`)} /></div>;
}

function NumberField({ label, value, min, max, onChange }) {
  return <div className="mb-6 flex w-full max-w-56 flex-col items-center"><label className="mb-2 text-center text-sm font-medium text-texto-suave">{label}</label><input type="number" value={value} min={min} max={max} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))} className="w-32 rounded-md border border-borda px-3 py-2 text-center text-lg focus:ring-2 focus:ring-foco focus:outline-none" /></div>;
}
