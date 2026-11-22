"use client";

import { useSyncExternalStore } from "react";

// `true` quando a media query bate. No servidor (e na hidratação) vale `false`, ou seja, o layout de celular.
export default function useMediaQuery(consulta) {
  return useSyncExternalStore(
    (avisar) => {
      const lista = window.matchMedia(consulta);
      lista.addEventListener("change", avisar);
      return () => lista.removeEventListener("change", avisar);
    },
    () => window.matchMedia(consulta).matches,
    () => false,
  );
}
