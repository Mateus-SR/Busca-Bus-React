"use client";

import { useSyncExternalStore } from "react";

const assinar = () => () => {};

// `false` no servidor e na hidratação, `true` depois que o componente monta no navegador.
// Serve para só chamar `createPortal(..., document.body)` quando o `document` existe.
export default function useMontado() {
  return useSyncExternalStore(
    assinar,
    () => true,
    () => false,
  );
}
