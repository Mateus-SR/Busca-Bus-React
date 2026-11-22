// Regras dos códigos de ponto (stop_id do Olho Vivo/GTFS) e padrões da exibição temporária.
// Ficam aqui para o formulário, a rota de exibições e o socket aplicarem exatamente a mesma regra.

export const TAMANHO_MAXIMO_CODIGO_PARADA = 9;
export const LIMITE_PARADAS_EXIBICAO = 5;

// Só dígitos, de 1 a 9. Existem pontos com códigos de vários tamanhos, então não exigimos um comprimento exato.
const PADRAO_CODIGO_PARADA = new RegExp(`^\\d{1,${TAMANHO_MAXIMO_CODIGO_PARADA}}$`);

export function codigoParadaValido(valor) {
  return PADRAO_CODIGO_PARADA.test(String(valor ?? ""));
}

// Para campos de digitação: tira o que não é dígito e corta no tamanho máximo.
export function limparCodigoParada(valor) {
  return String(valor ?? "").replace(/\D/g, "").slice(0, TAMANHO_MAXIMO_CODIGO_PARADA);
}

// A exibição temporária criada pelo mapa usa estes padrões e dura este tempo.
export const CONFIG_EXIBICAO_TEMPORARIA = Object.freeze({
  tempoAtraso: 2,
  tempoAdiantado: 2,
  distanciaMaxMin: 20,
  permitirMultiplosPorLinha: false,
});
export const VALIDADE_EXIBICAO_TEMPORARIA_HORAS = 24;
