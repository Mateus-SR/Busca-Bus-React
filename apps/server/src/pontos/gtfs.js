import { dentroDeSaoPaulo } from "@busca-bus/core";

// Leitor de CSV (RFC 4180): campos entre aspas, aspas escapadas ("") e quebras de linha dentro de campos.
export function lerCsv(texto) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let entreAspas = false;
  const conteudo = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;

  const fecharCampo = () => {
    linha.push(campo);
    campo = "";
  };
  const fecharLinha = () => {
    fecharCampo();
    // Ignora linhas totalmente vazias (ex.: quebra de linha no fim do arquivo).
    if (linha.length > 1 || linha[0] !== "") linhas.push(linha);
    linha = [];
  };

  for (let i = 0; i < conteudo.length; i += 1) {
    const caractere = conteudo[i];
    if (entreAspas) {
      if (caractere === '"') {
        if (conteudo[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else {
          entreAspas = false;
        }
      } else {
        campo += caractere;
      }
    } else if (caractere === '"') {
      entreAspas = true;
    } else if (caractere === ",") {
      fecharCampo();
    } else if (caractere === "\n") {
      fecharLinha();
    } else if (caractere !== "\r") {
      campo += caractere;
    }
  }
  if (campo !== "" || linha.length) fecharLinha();

  const [cabecalho, ...registros] = linhas;
  if (!cabecalho) return [];
  const colunas = cabecalho.map((coluna) => coluna.trim());
  return registros.map((valores) => Object.fromEntries(colunas.map((coluna, indice) => [coluna, valores[indice] ?? ""])));
}

// Converte uma linha do stops.txt no documento da coleção "pontos". Devolve { ponto } ou { descartado: motivo }.
// O GeoJSON usa [longitude, latitude]; o CSV traz latitude primeiro, então a ordem é invertida aqui.
export function registroParaPonto(registro) {
  const codigo = String(registro.stop_id ?? "").trim();
  if (!codigo) return { descartado: "sem stop_id" };
  const latTexto = String(registro.stop_lat ?? "").trim();
  const lngTexto = String(registro.stop_lon ?? "").trim();
  const lat = latTexto === "" ? NaN : Number(latTexto);
  const lng = lngTexto === "" ? NaN : Number(lngTexto);
  if (!dentroDeSaoPaulo(lat, lng)) return { descartado: "coordenada inválida ou fora de São Paulo" };
  return {
    ponto: {
      _id: codigo,
      nome: String(registro.stop_name ?? "").trim(),
      endereco: String(registro.stop_desc ?? "").trim(),
      loc: { type: "Point", coordinates: [lng, lat] },
    },
  };
}
