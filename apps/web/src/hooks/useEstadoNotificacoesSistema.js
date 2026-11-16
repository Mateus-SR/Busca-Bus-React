"use client";

import { useSyncExternalStore } from "react";
import { assinarEstadoNotificacoesSistema, estadoNotificacoesSistema } from "@/lib/notificacoesSistema";

export default function useEstadoNotificacoesSistema() {
  return useSyncExternalStore(assinarEstadoNotificacoesSistema, estadoNotificacoesSistema, () => "indisponivel");
}
