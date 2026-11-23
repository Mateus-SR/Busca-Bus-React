// Junta o que o radar da SPTrans sabe de cada ponto com o cadastro do GTFS (nome, endereço e coordenadas).
// É uma função pura, sem rede nem DOM, então vale para a web e para o app.

function textoOuNulo(valor) {
  const texto = typeof valor === "string" ? valor.trim() : "";
  return texto || null;
}

function posicaoValida(posicao) {
  return posicao && Number.isFinite(posicao.lat) && Number.isFinite(posicao.lng) ? { lat: posicao.lat, lng: posicao.lng } : null;
}

// `radar`: pontos do snapshot ({ codigo, nome, posicao }); a ordem da lista é o número e a cor do ponto no mapa.
// `cadastro`: pontos do GTFS ({ codigo, nome, endereco, lat, lng }), na ordem que vier.
// `paradas`: códigos da exibição; só valem quando o radar ainda não trouxe nenhum ponto (assim a legenda já aparece).
// O nome e o endereço do GTFS vencem os do radar, que só entram quando o GTFS não tem o ponto (ou o nome está vazio).
// A posição do radar vence a do GTFS porque é a que já era usada; o GTFS só preenche quando o radar não trouxe.
export function mesclarPontos({ radar = [], cadastro = [], paradas = [] } = {}) {
  const base = radar.length ? radar : paradas.map((codigo) => ({ codigo }));
  const porCodigo = new Map(cadastro.map((item) => [String(item.codigo), item]));
  return base.map((item) => {
    const codigo = String(item.codigo);
    const gtfs = porCodigo.get(codigo);
    return {
      codigo,
      nome: textoOuNulo(gtfs?.nome) ?? textoOuNulo(item.nome),
      endereco: textoOuNulo(gtfs?.endereco),
      posicao: posicaoValida(item.posicao) ?? posicaoValida({ lat: gtfs?.lat, lng: gtfs?.lng }),
    };
  });
}
