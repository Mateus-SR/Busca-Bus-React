import { SptransError } from "./cliente.js";

// Cenários de falha injetados entre o poller e a SPTrans, para testar o comportamento do sistema pelo painel
// (Detalhes técnicos) sem desligar a internet. O efeito é global ao servidor: vale para todas as salas.
export const CENARIOS = Object.freeze([
  { id: "normal", rotulo: "Normal (sem simulação)" },
  { id: "rede", rotulo: "Sem internet (falha de rede)" },
  { id: "timeout", rotulo: "SPTrans não responde (timeout)" },
  { id: "erro500", rotulo: "SPTrans com erro 500" },
  { id: "lenta", rotulo: "SPTrans lenta (+3 s)" },
  { id: "vazia", rotulo: "Sem previsões (resposta vazia)" },
  { id: "json_invalido", rotulo: "Resposta inválida (HTML no lugar de JSON)" },
]);

const DURACAO_PADRAO_MS = 60_000;
const DURACAO_MINIMA_MS = 1_000;
const DURACAO_MAXIMA_MS = 10 * 60_000;
const ATRASO_LENTA_MS = 3_000;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function criarSimulador(clienteReal, { timeoutMs = 10_000 } = {}) {
  let cenario = "normal";
  let desde = null;
  let expiraEm = null;
  let temporizador = null;

  function estado() {
    const atual = CENARIOS.find((item) => item.id === cenario);
    return {
      disponivel: true,
      cenario,
      rotulo: atual?.rotulo ?? cenario,
      desde: desde ? new Date(desde).toISOString() : null,
      expiraEm: expiraEm ? new Date(expiraEm).toISOString() : null,
      cenarios: CENARIOS,
    };
  }

  // Todo cenário diferente de "normal" expira sozinho, para não ficar esquecido ligado.
  function definir(novoCenario, duracaoMs) {
    if (!CENARIOS.some((item) => item.id === novoCenario)) throw new Error("Cenário desconhecido.");
    clearTimeout(temporizador);
    temporizador = null;
    cenario = novoCenario;
    if (novoCenario === "normal") {
      desde = null;
      expiraEm = null;
      return estado();
    }
    const duracao = Number.isFinite(duracaoMs) && duracaoMs > 0
      ? Math.min(Math.max(duracaoMs, DURACAO_MINIMA_MS), DURACAO_MAXIMA_MS)
      : DURACAO_PADRAO_MS;
    desde = Date.now();
    expiraEm = desde + duracao;
    temporizador = setTimeout(() => definir("normal"), duracao);
    temporizador.unref?.();
    return estado();
  }

  async function buscarPrevisao(codigoParada, ...resto) {
    switch (cenario) {
      case "rede":
        throw new TypeError("fetch failed (simulado: sem conexão com a internet)");
      case "timeout":
        await esperar(timeoutMs);
        throw new Error("The operation was aborted due to timeout (simulado)");
      case "erro500":
        throw new SptransError(`Falha ao consultar parada ${codigoParada}: 500 (simulado)`, 500);
      case "lenta":
        await esperar(ATRASO_LENTA_MS);
        return clienteReal.buscarPrevisao(codigoParada, ...resto);
      case "vazia": {
        const resposta = await clienteReal.buscarPrevisao(codigoParada, ...resto);
        return { ...resposta, p: resposta?.p ? { ...resposta.p, l: [] } : resposta?.p };
      }
      case "json_invalido":
        throw new SyntaxError("Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON (simulado)");
      default:
        return clienteReal.buscarPrevisao(codigoParada, ...resto);
    }
  }

  return {
    buscarPrevisao,
    autenticar: clienteReal.autenticar,
    diagnostico: () => clienteReal.diagnostico?.() ?? null,
    definir,
    estado,
  };
}
