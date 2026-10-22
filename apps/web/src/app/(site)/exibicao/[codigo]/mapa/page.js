import MapaView from "@/components/mapa/MapaView";
import { ONIBUS_MAPA_MOCK } from "@/lib/fixtures/mapaFixture";
import { EXIBICOES_MOCK } from "@/lib/fixtures/exibicoesFixture";

export function generateStaticParams() {
  return EXIBICOES_MOCK.map(({ codigo_exib }) => ({ codigo: codigo_exib }));
}

export default async function MapaExibicaoPage({ params }) {
  const { codigo } = await params;
  return <MapaView codigo={codigo} voltarHref={`/exibicao/${codigo}`} onibus={ONIBUS_MAPA_MOCK} />;
}
