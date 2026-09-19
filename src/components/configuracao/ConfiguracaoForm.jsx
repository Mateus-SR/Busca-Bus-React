"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Minus, Plus, Save, ChevronDown } from "lucide-react";
import { INSTITUICOES_MOCK } from "@/lib/fixtures/instituicoesFixture";
import { EXIBICOES_MOCK } from "@/lib/fixtures/exibicoesFixture";
import { useAuth } from "@/contexts/AuthContext";

const PADRAO = { nome: "", instituicao: "", semInstituicao: false, atraso: 1, adiantado: 1, distancia: 20, token: "", paradas: [""] };

export default function ConfiguracaoForm({ codigo }) {
  const router = useRouter();
  const { estaLogado } = useAuth();
  const existente = useMemo(() => EXIBICOES_MOCK.find((item) => item.codigo_exib === codigo), [codigo]);
  const [formulario, setFormulario] = useState(() => existente ? { nome: existente.nome_exibicao, instituicao: existente.instituicao, semInstituicao: false, atraso: existente.config.tempo_atraso, adiantado: existente.config.tempo_adiantado, distancia: existente.config.distanciaMinOnibus, token: "mock-sptrans-token", paradas: existente.codigos_parada } : PADRAO);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");

  if (!estaLogado) return <div className="mx-auto mt-12 max-w-2xl rounded-xl bg-white p-10 text-center shadow"><h1 className="text-2xl font-bold">Faça login para configurar uma exibição</h1><Link href="/login" className="mt-6 inline-block rounded-md bg-sptrans px-6 py-3 font-bold text-white">Entrar</Link></div>;

  function atualizar(campo, valor) { setFormulario((atual) => ({ ...atual, [campo]: valor })); }
  function atualizarParada(indice, valor) { setFormulario((atual) => ({ ...atual, paradas: atual.paradas.map((parada, i) => i === indice ? valor.replace(/\D/g, "").slice(0, 9) : parada) })); }
  function salvar(evento) {
    evento.preventDefault();
    const paradasValidas = formulario.paradas.filter(Boolean);
    if (!formulario.token.trim()) return setMensagem("Token da API é obrigatório nesta demonstração.");
    if (!paradasValidas.length || paradasValidas.some((parada) => ![7, 9].includes(parada.length))) return setMensagem("Um ou mais códigos são inválidos. Verifique os campos em vermelho.");
    setMensagem(codigo ? "Exibição atualizada com sucesso!" : "Exibição criada com sucesso!");
    setTimeout(() => router.push(`/exibicao/${codigo || "Nova01"}`), 900);
  }
  function adicionar() { if (formulario.paradas.length < 5) atualizar("paradas", [...formulario.paradas, ""]); }
  function remover() { if (formulario.paradas.length > 1) atualizar("paradas", formulario.paradas.slice(0, -1)); }

  return <div className="relative mx-auto my-8 w-full max-w-4xl rounded-xl border border-gray-300 bg-white p-6 shadow-2xl sm:p-10"><h1 className="mb-8 text-center text-3xl font-bold text-black">Configuração</h1><Link href="/" className="absolute top-12 left-6 text-sm text-black">Voltar</Link><form onSubmit={salvar}>
    <div className="mb-6"><label htmlFor="nomeExib" className="mb-2 block text-sm font-medium text-gray-700">Nome da exibição (Opcional)</label><input id="nomeExib" value={formulario.nome} onChange={(e) => atualizar("nome", e.target.value)} placeholder="exemplo: Fatec-ZL" className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>
    <div className="mb-6"><label className="mb-2 block text-sm font-medium text-gray-700">Instituição</label><div className="relative"><button type="button" onClick={() => !formulario.semInstituicao && setDropdownAberto(!dropdownAberto)} className={`w-full rounded-md border border-gray-300 px-4 py-3 text-left ${formulario.semInstituicao ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-white"}`}>{formulario.semInstituicao ? "Nenhuma instituição selecionada" : INSTITUICOES_MOCK.find((item) => item.id_fac === formulario.instituicao)?.nome_fac ?? "Selecione uma instituição"}<ChevronDown className="float-right" /></button>{dropdownAberto && <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">{INSTITUICOES_MOCK.map((item) => <button type="button" key={item.id_fac} onClick={() => { atualizar("instituicao", item.id_fac); setDropdownAberto(false); }} className="block w-full px-4 py-2 text-left text-black hover:bg-gray-100">{item.nome_fac}</button>)}</div>}</div><label className="mt-3 flex items-center text-sm text-gray-700"><input type="checkbox" checked={formulario.semInstituicao} onChange={(e) => atualizar("semInstituicao", e.target.checked)} className="mr-2" />Não faço parte de uma instituição / Prefiro não informar</label></div>
    <div className="flex flex-wrap justify-center gap-3.5"><NumberField label="Tolerância atraso (1–5 min)" value={formulario.atraso} min={1} max={5} onChange={(valor) => atualizar("atraso", valor)} /><NumberField label="Tolerância adiantado (1–5 min)" value={formulario.adiantado} min={1} max={5} onChange={(valor) => atualizar("adiantado", valor)} /><NumberField label="Distância máxima (5-60 min)" value={formulario.distancia} min={5} max={60} onChange={(valor) => atualizar("distancia", valor)} /></div>
    <div className="mb-8 border-t border-gray-200 pt-6"><label htmlFor="tokenApi" className="mb-2 block text-sm font-bold text-red-700">🔑 Token da API Olho Vivo (SPTrans)</label><input id="tokenApi" value={formulario.token} onChange={(e) => atualizar("token", e.target.value)} placeholder="Cole seu token aqui..." className="w-full rounded-md border border-gray-300 px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" /><p className="mt-2 text-xs text-gray-500">Obrigatório. Valor mockado nesta fase.</p></div>
    <div><div className="mb-2 flex justify-between text-sm font-medium text-gray-700"><label>Código do ponto de ônibus</label><span className="underline">Onde achar o código</span></div>{formulario.paradas.map((parada, indice) => <input key={indice} value={parada} onChange={(e) => atualizarParada(indice, e.target.value)} placeholder="exemplo: 650004840" inputMode="numeric" className={`mb-2 w-full rounded-md border px-4 py-3 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none ${parada && ![7, 9].includes(parada.length) ? "bg-sptrans/25 border-sptrans" : "border-gray-300"}`} />)}</div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-5"><div className="flex gap-10"><button type="button" disabled={formulario.paradas.length >= 5} onClick={adicionar} className="flex items-center gap-2 font-roboto-mono italic disabled:cursor-not-allowed disabled:text-gray-400"><Plus />Adicionar</button><button type="button" disabled={formulario.paradas.length <= 1} onClick={remover} className="flex items-center gap-2 font-roboto-mono italic disabled:cursor-not-allowed disabled:text-gray-400"><Minus />Remover</button></div><button type="submit" className="flex items-center gap-2 font-roboto-mono italic hover:text-sptrans"><Save />Salvar</button></div>
    {mensagem && <p className="mt-5 text-center font-semibold text-sptrans">{mensagem}</p>}
  </form></div>;
}

function NumberField({ label, value, min, max, onChange }) {
  return <div className="mb-6 flex w-56 flex-col items-center"><label className="mb-2 text-center text-sm font-medium text-gray-700">{label}</label><input type="number" value={value} min={min} max={max} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))} className="w-32 rounded-md border border-gray-300 px-3 py-2 text-center text-lg focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>;
}
