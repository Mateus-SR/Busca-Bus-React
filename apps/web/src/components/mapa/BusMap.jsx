"use client";

import { useEffect, useRef } from "react";

export default function BusMap({ codigo, onibus = [] }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let mapa;
    let cancelado = false;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !containerRef.current) return;
      mapa = L.map(containerRef.current).setView([-23.556, -46.475], 13);
      onibus.forEach((onibusAtual) => {
        L.marker([onibusAtual.latitude, onibusAtual.longitude], { icon: L.divIcon({ className: "bus-marker", html: `<span>${onibusAtual.codigo}</span>`, iconSize: [80, 26], iconAnchor: [40, 13] }) })
          .addTo(mapa)
          .bindPopup(`<strong>${onibusAtual.codigo}</strong><br />${onibusAtual.sentido}`);
      });
    });
    return () => {
      cancelado = true;
      mapa?.remove();
    };
  }, [onibus]);

  return <div ref={containerRef} data-codigo={codigo} className="h-full min-h-[420px] w-full" />;
}
