import { Suspense } from "react";
import PontosView from "@/components/pontos/PontosView";

export const metadata = {
  title: "Pontos perto de você | Busca Bus",
  description: "Encontre pontos de ônibus de São Paulo perto da sua localização e descubra o código de cada um.",
};

export default function PontosPage() {
  // PontosView lê a URL (?parada=, ?voltar=) com useSearchParams, que exige um limite de Suspense.
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <PontosView />
    </Suspense>
  );
}
