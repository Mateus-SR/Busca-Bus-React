import MapaView from "@/components/mapa/MapaView";
import { ONIBUS_MAPA_MOCK } from "@/lib/fixtures/mapaFixture";

export default async function MapaExibicaoPage({ params }) {
  const { codigo } = await params;
  return <MapaView codigo={codigo} voltarHref={`/exibicao/${codigo}`} onibus={ONIBUS_MAPA_MOCK} />;
}
