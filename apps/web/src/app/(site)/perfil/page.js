"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Avatar from "@/components/ui/Avatar";
import InstituicaoSelect from "@/components/ui/InstituicaoSelect";

const AVATARES = [
  { id: "avatar-13", nome: "Beca" },
  { id: "avatar-02", nome: "Mateus" },
  { id: "avatar-07", nome: "Laura" },
  { id: "avatar-11", nome: "JP" },
  { id: "avatar-06", nome: "Pedro" },
  { id: "avatar-05", nome: "Guilherme" },
  { id: "avatar-01", nome: "Paula" },
  { id: "avatar-03", nome: "Marisa" },
  { id: "avatar-04", nome: "Ana" },

  { id: "avatar-08", nome: "Bia" },
  { id: "avatar-09", nome: "Samara" },
  { id: "avatar-10", nome: "Gaby" },
  { id: "avatar-12", nome: "Henrique" },
  { id: "avatar-14", nome: "Sofia" },
  { id: "avatar-15", nome: "Merida" },
  { id: "avatar-16", nome: "Débora" },
];
export default function PerfilPage() {
  const { usuario, estaLogado, carregando, atualizarAvatar, atualizarInstituicao, } = useAuth();
  const [galeriaAberta, setGaleriaAberta] = useState(false);
  const [avatarSelecionado, setAvatarSelecionado] = useState(usuario?.avatarId || null);
  const [salvando, setSalvando] = useState(false);
  const [erroAvatar, setErroAvatar] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [carregandoInstituicao, setCarregandoInstituicao] = useState(false);
  const [editandoInstituicao, setEditandoInstituicao] = useState(false);
  const [instituicaoSelecionada, setInstituicaoSelecionada] = useState(usuario?.fac_id || "");
  const [semInstituicao, setSemInstituicao] = useState(!usuario?.fac_id);
  const [salvandoInstituicao, setSalvandoInstituicao] = useState(false);
  const [erroInstituicao, setErroInstituicao] = useState("");
  const [sucessoInstituicao, setSucessoInstituicao] = useState("");

  useEffect(() => {
    async function carregarInstituicao() {
      if (!usuario?.fac_id) {
        setInstituicao("");
        return;
      }

      try {
        setCarregandoInstituicao(true);

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

        const resposta = await fetch(`${API_URL}/v1/fatecs`);

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar as instituições.");
        }

        const dados = await resposta.json();

        const encontrada = dados.fatecs?.find(
          (item) => item.id_fac === usuario.fac_id
        );

        setInstituicao(encontrada?.nome_fac || "Instituição não encontrada");
      } catch {
        setInstituicao("Não foi possível carregar a instituição");
      } finally {
        setCarregandoInstituicao(false);
      }
    }

    carregarInstituicao();
  }, [usuario?.fac_id]);

  if (carregando) return <main className="min-h-screen" />;

  if (!estaLogado) {
    return (
      <main className="relative min-h-screen bg-[url(/img/Onibus2.png)] bg-cover bg-center contraste:bg-none">
        <div className="absolute inset-0 bg-black/40 contraste:hidden" />
        <div className="relative flex min-h-screen items-center justify-center px-4 py-6">
          <section className="w-full max-w-lg rounded-2xl border border-borda bg-superficie p-6 text-center shadow-2xl sm:p-8">
            <h1 className="mb-3 text-2xl font-extrabold text-texto">Meu perfil</h1>
            <p className="mb-6 text-texto-suave">Faça login para visualizar seu perfil.</p>
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-destaque px-5 py-3 font-bold text-sobre-destaque transition hover:bg-destaque-forte"
            >
              Entrar
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const nome = usuario?.nome || "Não informado";
  const email = usuario?.email || "Não informado";
  const avatarAtual = usuario?.avatarId || null;

  function abrirGaleria() {
    setAvatarSelecionado(avatarAtual);
    setErroAvatar("");
    setGaleriaAberta(true);
  }

  async function salvarAvatar() {
    try {
      setSalvando(true);
      setErroAvatar("");
      await atualizarAvatar(avatarSelecionado);
      setGaleriaAberta(false);
    } catch (error) {
      setErroAvatar(error.message || "Não foi possível salvar o avatar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-[url(/img/Onibus2.png)] bg-cover bg-center contraste:bg-none">
      <div className="absolute inset-0 bg-black/40 contraste:hidden" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-6">
        <section className="w-full max-w-3xl rounded-2xl border border-borda bg-superficie p-6 shadow-2xl sm:p-10">
          <div className="mb-8 flex flex-col items-center gap-6 border-b border-borda pb-8 text-center sm:flex-row sm:items-center sm:text-left">
            <button
              type="button"
              onClick={abrirGaleria}
              className="group rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-foco"
              aria-label="Trocar avatar"
              title="Clique para trocar o avatar"
            >
              <Avatar
                avatarId={avatarAtual}
                alt={`Avatar de ${nome}. Clique para trocar o avatar.`}
                className="size-40 border-4 border-acento transition group-hover:brightness-90 sm:size-48"
              />
            </button>
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold text-texto">Meu perfil</h1>
              <p className="mt-2 text-texto-mudo">Dados da sua conta</p>
              <p className="mt-3 text-sm text-texto-mudo">Toque no avatar para trocar</p>
            </div>
          </div>

          <dl className="divide-y divide-borda rounded-xl border border-borda">
            <div className="grid gap-1 px-4 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
              <dt className="font-semibold text-texto-secundario">Nome</dt>
              <dd className="break-words text-texto-suave">{nome}</dd>
            </div>
            <div className="grid gap-1 px-4 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
              <dt className="font-semibold text-texto-secundario">E-mail</dt>
              <dd className="break-words text-texto-suave">{email}</dd>
            </div>
            <div className="grid gap-1 px-4 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
              <dt className="font-semibold text-texto-secundario">Instituição</dt>

              <dd className="text-texto-suave">
                {!editandoInstituicao ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      {!usuario?.fac_id
                        ? "Não informada"
                        : carregandoInstituicao
                          ? "Carregando instituição..."
                          : instituicao || "Não foi possível carregar a instituição"}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setInstituicaoSelecionada(usuario?.fac_id || "");
                        setSemInstituicao(!usuario?.fac_id);
                        setErroInstituicao("");
                        setSucessoInstituicao("");
                        setEditandoInstituicao(true);
                      }}
                      className="text-sm font-medium text-destaque hover:underline"
                    >
                      Alterar
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <InstituicaoSelect
                      instituicao={instituicaoSelecionada}
                      semInstituicao={semInstituicao}
                      onChange={({ instituicao, semInstituicao }) => {
                        setInstituicaoSelecionada(instituicao);
                        setSemInstituicao(semInstituicao);
                      }}
                    />

                    {erroInstituicao && (
                      <p className="mb-3 text-sm text-erro-forte">
                        {erroInstituicao}
                      </p>
                    )}

                    {sucessoInstituicao && (
                      <p className="mb-3 text-sm text-verde">
                        {sucessoInstituicao}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={salvandoInstituicao}
                        onClick={async () => {
                          try {
                            setSalvandoInstituicao(true);
                            setErroInstituicao("");
                            setSucessoInstituicao("");

                            await atualizarInstituicao(
                              semInstituicao ? null : instituicaoSelecionada || null
                            );

                            setEditandoInstituicao(false);
                            setSucessoInstituicao("Instituição atualizada com sucesso!");
                          } catch (error) {
                            setErroInstituicao(
                              error.message || "Não foi possível atualizar a instituição."
                            );
                          } finally {
                            setSalvandoInstituicao(false);
                          }
                        }}
                        className="rounded-md bg-destaque px-4 py-2 text-sm font-bold text-sobre-destaque disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {salvandoInstituicao ? "Salvando..." : "Salvar"}
                      </button>

                      <button
                        type="button"
                        disabled={salvandoInstituicao}
                        onClick={() => {
                          setEditandoInstituicao(false);
                          setErroInstituicao("");
                          setInstituicaoSelecionada(usuario?.fac_id || "");
                          setSemInstituicao(!usuario?.fac_id);
                        }}
                        className="rounded-md border border-borda px-4 py-2 text-sm font-medium text-texto-suave disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>


      {galeriaAberta && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/60 px-4 py-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-galeria-avatares"
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-borda bg-superficie p-5 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex shrink-0 items-center justify-between gap-4">
              <div>
                <h2 id="titulo-galeria-avatares" className="text-2xl font-extrabold text-texto">
                  Escolha seu personagem
                </h2>
                <p className="mt-1 text-sm text-texto-mudo">
                  Selecione um avatar para representar você.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setGaleriaAberta(false)}
                className="rounded-full p-2 text-texto-secundario hover:bg-superficie-alt"
                aria-label="Fechar galeria"
              >
                <X />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {AVATARES.map((avatar) => {
                  const selecionado = avatarSelecionado === avatar.id;

                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setAvatarSelecionado(avatar.id)}
                      className={`group relative flex flex-col items-center rounded-2xl border-2 p-3 transition hover:bg-superficie-alt ${selecionado
                        ? "border-acento bg-acento/10"
                        : "border-borda"
                        }`}
                      aria-label={`Selecionar ${avatar.nome}`}
                      aria-pressed={selecionado}
                    >
                      <Avatar
                        avatarId={avatar.id}
                        alt=""
                        className="size-24 sm:size-28"
                      />

                      <span className={`mt-2 text-sm font-semibold text-texto-suave contraste:group-hover:text-white ${selecionado ? "contraste:text-white" : ""
                        }`}>
                        {avatar.nome}
                      </span>

                      {selecionado && (
                        <Check
                          className="absolute right-2 top-2 text-acento"
                          size={20}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {erroAvatar && (
                <p className="mt-4 text-center text-sm font-semibold text-erro-forte">
                  {erroAvatar}
                </p>
              )}
            </div>

            <div className="mt-4 flex shrink-0 justify-end gap-3 border-t border-borda bg-superficie pt-4">
              <button
                type="button"
                onClick={() => setGaleriaAberta(false)}
                className="rounded-xl border border-borda px-4 py-3 font-semibold text-texto-suave hover:bg-superficie-alt"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={salvarAvatar}
                disabled={salvando}
                className="rounded-xl bg-destaque px-4 py-3 font-bold text-sobre-destaque hover:bg-destaque-forte disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar personagem"}
              </button>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}
