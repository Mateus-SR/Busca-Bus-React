"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EventoBloco from "./EventoBloco";
import EventoPopup from "./EventoPopup";
import {
  ALTURA_HORA,
  HORA_FIM,
  HORA_INICIO,
  MARGEM_TOPO,
  adicionarDias,
  distribuirColunas,
  diasDaSemana,
  eventosDoDia,
  inicioDaSemana,
  mesmoDia,
  nomeDoMes,
  posicaoVertical,
  prepararEventos,
  siglaDiaSemana,
} from "@/utils/calendario";

// 7, 8, 9 ... 22 (cada número é o começo de uma linha da grade)
const HORAS = Array.from({ length: HORA_FIM - HORA_INICIO }, (_, i) => HORA_INICIO + i);

// 1 coluna para as horas + 7 colunas iguais para os dias
const COLUNAS = "grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]";

export default function CalendarioView({ eventos: eventosBrutos }) {
  // "hoje" e a semana começam null de propósito: o servidor pode estar em outro fuso e
  // calcular um dia diferente do navegador. Definimos tudo só depois de montar no navegador.
  const [hoje, setHoje] = useState(null);
  const [inicioSemana, setInicioSemana] = useState(null);
  const [eventoAberto, setEventoAberto] = useState(null);

  const gatilhoRef = useRef(null); // botão que abriu o pop-up (o foco volta para ele)
  const rolagemRef = useRef(null); // a caixa com scroll da grade

  const eventos = useMemo(() => prepararEventos(eventosBrutos), [eventosBrutos]);

  useEffect(() => {
    const agora = new Date();
    setHoje(agora);
    setInicioSemana(inicioDaSemana(agora));
  }, []);

  // Ao trocar de semana, rola a grade até o primeiro evento (senão um evento das 19h ficaria escondido).
  useEffect(() => {
    if (!inicioSemana || !rolagemRef.current) return;

    const fimSemana = adicionarDias(inicioSemana, 7);
    const daSemana = eventos.filter((e) => e.inicio >= inicioSemana && e.inicio < fimSemana);

    const primeiroTop = daSemana.length
      ? Math.min(...daSemana.map((e) => posicaoVertical(e).top))
      : 0;
    rolagemRef.current.scrollTop = Math.max(0, primeiroTop - 12);
  }, [inicioSemana, eventos]);

  const abrirEvento = (evento, botao) => {
    gatilhoRef.current = botao;
    setEventoAberto(evento);
  };

  const fecharEvento = useCallback(() => {
    setEventoAberto(null);
    gatilhoRef.current?.focus();
  }, []);

  if (!inicioSemana) {
    return <div className="mt-6 h-96 animate-pulse rounded bg-gray-100" aria-hidden="true" />;
  }

  const dias = diasDaSemana(inicioSemana);
  const mesInicio = nomeDoMes(dias[0]);
  const mesFim = nomeDoMes(dias[6]);
  const tituloMes = mesInicio === mesFim ? mesInicio : `${mesInicio} / ${mesFim}`;

  const mudarSemana = (quantidade) =>
    setInicioSemana((atual) => adicionarDias(atual, quantidade * 7));

  return (
    <section aria-label="Calendário semanal de eventos" className="mt-4">
      {/* Título + setas */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{tituloMes}</h1>
        <span className="mt-2 text-sm font-semibold text-gray-500">{dias[6].getFullYear()}</span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => mudarSemana(-1)}
            aria-label="Semana anterior"
            className="cursor-pointer rounded-full p-1.5 transition hover:bg-gray-200"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => mudarSemana(1)}
            aria-label="Próxima semana"
            className="cursor-pointer rounded-full p-1.5 transition hover:bg-gray-200"
          >
            <ChevronRight size={24} strokeWidth={3} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setInicioSemana(inicioDaSemana(new Date()))}
          className="ml-auto cursor-pointer rounded-xl border-2 border-gray-300 px-3.5 py-1.5 text-sm font-bold transition hover:bg-gray-100"
        >
          Hoje
        </button>
      </div>

      {/* Grade. Uma única caixa rola nos dois sentidos; cabeçalho e coluna de horas ficam "sticky". */}
      <div
        ref={rolagemRef}
        role="region"
        tabIndex={0} // permite rolar a grade com as setas do teclado
        aria-label="Grade de horários da semana"
        className="max-h-[max(24rem,calc(100dvh-13rem))] overflow-auto border border-gray-500 bg-white"
      >
        <div className="min-w-[44rem]">
          {/* Linha dos dias: DOM. 18 | SEG. 19 ... */}
          <div className={`${COLUNAS} sticky top-0 z-20 border-b border-gray-500 bg-white`}>
            <div className="sticky left-0 bg-white" />
            {dias.map((dia) => {
              const ehHoje = mesmoDia(dia, hoje);
              return (
                <div
                  key={dia.getTime()}
                  className="flex flex-col items-center gap-1 border-l border-gray-400 py-2"
                >
                  <span className="text-xs font-medium">{siglaDiaSemana(dia)}</span>
                  {/* <div> (e não <span>) para o modo de alto contraste do site enxergar o fundo.
                      A borda grossa só no "hoje" o destaca mesmo quando as cores são trocadas. */}
                  <div
                    aria-current={ehHoje ? "date" : undefined}
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-2xl ${
                      ehHoje
                        ? "border-4 border-sptrans bg-sptrans font-bold text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {dia.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Corpo: coluna das horas + 7 colunas de dias */}
          <div className={COLUNAS}>
            <div className="sticky left-0 z-10 bg-white" style={{ paddingTop: MARGEM_TOPO }}>
              {HORAS.map((hora) => (
                <div key={hora} className="relative" style={{ height: ALTURA_HORA }}>
                  <span className="absolute top-0 right-2 -translate-y-1/2 text-xs text-gray-600">
                    {String(hora).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {dias.map((dia) => (
              <div
                key={dia.getTime()}
                className="relative border-l border-gray-400"
                style={{ paddingTop: MARGEM_TOPO }}
              >
                {/* Linhas de hora (só decoração) */}
                {HORAS.map((hora, i) => (
                  <div
                    key={hora}
                    className={`border-t border-gray-300 ${i === HORAS.length - 1 ? "border-b" : ""}`}
                    style={{ height: ALTURA_HORA }}
                  />
                ))}

                {/* Eventos do dia, por cima das linhas */}
                {distribuirColunas(eventosDoDia(eventos, dia)).map(
                  ({ evento, coluna, totalColunas }) => (
                    <EventoBloco
                      key={evento.id_evento}
                      evento={evento}
                      coluna={coluna}
                      totalColunas={totalColunas}
                      onAbrir={abrirEvento}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <EventoPopup evento={eventoAberto} onClose={fecharEvento} />
    </section>
  );
}