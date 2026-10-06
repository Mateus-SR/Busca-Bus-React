import MapaView from "@/components/mapa/MapaView";
import { ONIBUS_MAPA_MOCK } from "@/lib/fixtures/mapaFixture";

export default function MapaPage() {
  return <MapaView voltarHref="/" onibus={ONIBUS_MAPA_MOCK} />;
}
