"use client";

import { useEffect, useRef } from "react";
import { ONIBUS_MAPA_MOCK } from "@/lib/fixtures/mapaFixture";

export default function BusMap() {
  const containerRef = useRef(null);

  useEffect(() => {
    let mapa;
    let cancelado = false;
    import("leaflet").then(({ default: L }) => {
      if (cancelado || !containerRef.current) return;
      mapa = L.map(containerRef.current).setView([-23.556, -46.475], 13);
      ONIBUS_MAPA_MOCK.forEach((onibus) => {
        L.marker([onibus.latitude, onibus.longitude], { icon: L.divIcon({ className: "bus-marker", html: `<span>${onibus.codigo}</span>`, iconSize: [80, 26], iconAnchor: [40, 13] }) })
          .addTo(mapa)
          .bindPopup(`<strong>${onibus.codigo}</strong><br />${onibus.sentido}`);
      });
    });
    return () => {
      cancelado = true;
      mapa?.remove();
    };
  }, []);

  return <div ref={containerRef} className="h-full min-h-[420px] w-full" />;
}
