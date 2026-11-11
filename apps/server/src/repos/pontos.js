// Campos devolvidos ao cliente: o _id vira "codigo" e o GeoJSON [lng, lat] vira lat/lng soltos.
const PROJECAO = {
  _id: 0,
  codigo: "$_id",
  nome: 1,
  endereco: 1,
  lat: { $arrayElemAt: ["$loc.coordinates", 1] },
  lng: { $arrayElemAt: ["$loc.coordinates", 0] },
};

export function criarPontosRepo(db) {
  const collection = db?.collection("pontos");

  const pontosPerto = (centro, raioMetros, limite) => collection.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [centro.lng, centro.lat] },
        distanceField: "distancia",
        maxDistance: raioMetros,
        spherical: true,
        key: "loc",
      },
    },
    { $limit: limite },
    { $project: { ...PROJECAO, distancia: { $round: ["$distancia", 0] } } },
  ]).toArray();

  return {
    disponivel: Boolean(collection),
    proximos: pontosPerto,
    async maisProximo(centro, raioMaximoMetros) {
      const [ponto] = await pontosPerto(centro, raioMaximoMetros, 1);
      return ponto ?? null;
    },
    naArea({ norte, sul, leste, oeste }, limite) {
      return collection.aggregate([
        {
          $match: {
            loc: {
              $geoWithin: {
                $geometry: {
                  type: "Polygon",
                  coordinates: [[[oeste, sul], [leste, sul], [leste, norte], [oeste, norte], [oeste, sul]]],
                },
              },
            },
          },
        },
        { $limit: limite },
        { $project: PROJECAO },
      ]).toArray();
    },
    buscarTexto(termo, limite) {
      return collection.aggregate([
        { $match: { $text: { $search: termo, $language: "portuguese" } } },
        { $sort: { score: { $meta: "textScore" } } },
        { $limit: limite },
        { $project: PROJECAO },
      ]).toArray();
    },
    buscarCodigo(codigo) {
      return collection.aggregate([{ $match: { _id: codigo } }, { $project: PROJECAO }]).toArray();
    },
  };
}
