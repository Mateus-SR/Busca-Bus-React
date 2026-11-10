"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listarEventosDaSemana } from "@/lib/eventosApi";

function hora(data) {
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventosDoDia(eventos, agora) {
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 1);
  return eventos
    .map((evento) => ({
      ...evento,
      inicioData: new Date(evento.inicio),
      fimData: new Date(evento.fim),
    }))
    .filter(({ inicioData, fimData }) =>
      !Number.isNaN(inicioData.getTime()) &&
      !Number.isNaN(fimData.getTime()) &&
      fimData >= inicio &&
      inicioData < fim
    )
    .sort((a, b) => a.inicioData - b.inicioData);
}

export default function EventosProximos() {
  const { usuario, carregando } = useAuth();
  const [eventos, setEventos] = useState(null);
  const [agora, setAgora] = useState(() => new Date());
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!usuario?.fac_id) return;
    try {
      setErro(null);
      const inicio = new Date();
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 1);
      setEventos(await listarEventosDaSemana({ facId: usuario.fac_id, inicio, fim }));
    } catch (error) {
      setErro(error.message);
    }
  }, [usuario?.fac_id]);

  useEffect(() => {
    if (!carregando) void carregar();
    const atualizacao = setInterval(() => {
      setAgora(new Date());
      if (!carregando) void carregar();
    }, 60_000);
    return () => clearInterval(atualizacao);
  }, [carregando, carregar]);

  const eventosVisiveis = useMemo(() => eventosDoDia(eventos ?? [], agora), [eventos, agora]);

  if (carregando || !usuario?.fac_id || erro || (eventos === null && eventosVisiveis.length === 0)) return null;

  return (
    <aside className="w-full min-w-0 rounded-xl border border-borda bg-superficie-alt/70 p-3 text-left" aria-label="Eventos de hoje">
      <div className="mb-2 flex items-center gap-2">
        <CalendarDays className="shrink-0 text-acento" size={19} aria-hidden="true" />
        <h2 className="text-sm font-bold text-texto">Eventos de hoje</h2>
      </div>
      {eventosVisiveis.length === 0 ? (
        <p className="text-xs text-texto-mudo">Nenhum evento para hoje.</p>
      ) : (
      <ul className={`space-y-2 pr-1 text-xs text-texto-suave ${eventosVisiveis.length > 3 ? "h-24 overflow-y-scroll" : ""}`}>
        {eventosVisiveis.map((evento) => (
          <li
            key={evento.id_evento}
            className="flex min-w-0 items-start gap-2 border-l-2 border-acento pl-2"
            title={`${evento.titulo} — ${hora(evento.inicioData)} às ${hora(evento.fimData)} · ${evento.local}`}
          >
            <span className="shrink-0 font-bold">{hora(evento.inicioData)}</span>
            <span className="min-w-0 truncate">{evento.titulo} · {evento.local}</span>
          </li>
        ))}
      </ul>
      )}
    </aside>
  );
}
