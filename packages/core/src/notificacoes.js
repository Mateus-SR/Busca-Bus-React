import { minutosAteChegar, minutosDoDiaEmSaoPaulo } from "./time.js";

// Núcleo das notificações de linhas seguidas. Tudo aqui é puro e neutro de plataforma: recebe a lista de ônibus que o
// radar já entrega (nada de rede, relógio global ou storage) e devolve eventos e textos. Quem entrega a notificação
// (toast, Notification API, expo-notifications) fica em cada app.

export const TIPOS_NOTIFICACAO = Object.freeze({
  APARECEU: "apareceu",
  CHEGANDO: "chegando",
  STATUS: "status",
  SAIU: "saiu",
});

export const MINUTOS_CHEGANDO_OPCOES = Object.freeze([1, 3, 5, 10]);
export const MINUTOS_CHEGANDO_PADRAO = 3;

// Quantos ciclos seguidos um ônibus precisa ficar fora do radar para valer como "saiu". O radar costuma "piscar"
// (o ônibus some por um ciclo e volta); sem essa tolerância cada piscada geraria "saiu" + "apareceu".
export const CICLOS_PARA_SAIR = 2;

// Acima disso, os eventos de um mesmo ciclo viram uma única notificação agrupada.
export const LIMITE_EVENTOS_POR_CICLO = 3;

export const EVENTOS_SEGUIDA_PADRAO = Object.freeze({
  [TIPOS_NOTIFICACAO.APARECEU]: true,
  [TIPOS_NOTIFICACAO.CHEGANDO]: true,
  [TIPOS_NOTIFICACAO.STATUS]: true,
  [TIPOS_NOTIFICACAO.SAIU]: false,
});

const FORMATO_PREVISAO = /^\d{1,2}:\d{2}$/;

function normalizarTexto(valor) {
  return String(valor ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

// Linha + sentido identificam o que o usuário segue (a mesma linha tem um sentido de ida e outro de volta).
export function chaveSeguida(codigoLetreiro, sentidoLinha) {
  return `${normalizarTexto(codigoLetreiro)}|${normalizarTexto(sentidoLinha)}`;
}

export function chaveDoOnibus(onibus) {
  return chaveSeguida(onibus?.codigoLetreiro, onibus?.sentidoLinha);
}

export function normalizarConfigSeguida(config = {}) {
  const minutos = Number(config.minutosChegando);
  return {
    minutosChegando: MINUTOS_CHEGANDO_OPCOES.includes(minutos) ? minutos : MINUTOS_CHEGANDO_PADRAO,
    eventos: Object.fromEntries(
      Object.entries(EVENTOS_SEGUIDA_PADRAO).map(([tipo, padrao]) => [
        tipo,
        typeof config.eventos?.[tipo] === "boolean" ? config.eventos[tipo] : padrao,
      ]),
    ),
  };
}

export function criarSeguida(linha, config) {
  return {
    chave: chaveSeguida(linha.codigoLetreiro, linha.sentidoLinha),
    codigoLetreiro: String(linha.codigoLetreiro ?? "").trim(),
    sentidoLinha: String(linha.sentidoLinha ?? "").trim(),
    ...normalizarConfigSeguida(config),
  };
}

// Lista as seguidas de uma exibição a partir do formato guardado pelo store ({ [exibicao]: { [chave]: seguida } }).
export function listarSeguidas(seguidasPorExibicao, exibicao) {
  return Object.values(seguidasPorExibicao?.[String(exibicao)] ?? {});
}

export function criarEstadoDeteccao() {
  return { inicializado: false, registros: {} };
}

function minutosDaPrevisao(previsao, agoraMin) {
  if (typeof previsao !== "string" || !FORMATO_PREVISAO.test(previsao.trim())) return null;
  return minutosAteChegar(previsao.trim(), agoraMin);
}

function montarEvento(tipo, onibus, extras = {}) {
  return {
    tipo,
    id: String(onibus.id),
    chave: chaveDoOnibus(onibus),
    codigoLetreiro: onibus.codigoLetreiro,
    sentidoLinha: onibus.sentidoLinha,
    previsao: onibus.previsao ?? null,
    status: onibus.status ?? null,
    codigoParada: onibus.codigoParada ?? null,
    ...extras,
  };
}

// Compara o estado guardado do ciclo anterior com a lista atual e devolve `{ estado, eventos }`.
//  - O primeiro lote é só a linha de base: registra tudo e não gera evento (abrir/recarregar a página não notifica).
//  - Cada evento dispara uma vez por ônibus; o registro some quando o ônibus sai do radar (após CICLOS_PARA_SAIR).
//  - Só gera evento para linhas seguidas e para os tipos que o usuário ligou.
// O estado devolvido é novo (o recebido não é alterado), então vale guardá-lo em ref ou useState.
export function detectarEventos(estado, atual, seguidas, { agoraMin = minutosDoDiaEmSaoPaulo() } = {}) {
  const base = estado ?? criarEstadoDeteccao();
  const lista = Array.isArray(atual) ? atual : [];
  const porChave = new Map((seguidas ?? []).map((seguida) => [seguida.chave, normalizarConfigSeguida(seguida)]));
  const linhaDeBase = !base.inicializado;

  const eventos = [];
  const registros = {};
  const vistos = new Set();

  for (const onibus of lista) {
    if (onibus?.id === undefined || onibus?.id === null) continue;
    const id = String(onibus.id);
    if (vistos.has(id)) continue;
    vistos.add(id);

    const config = porChave.get(chaveDoOnibus(onibus));
    const registroAnterior = base.registros[id];
    const minutos = minutosDaPrevisao(onibus.previsao, agoraMin);
    const dentroDoLimite = Boolean(config) && minutos !== null && minutos <= config.minutosChegando;

    const registro = {
      onibus,
      status: onibus.status ?? null,
      chegou: registroAnterior?.chegou ?? false,
      ausencias: 0,
    };
    registros[id] = registro;

    if (linhaDeBase) {
      // Quem já estava dentro do limite quando a tela abriu não notifica depois.
      if (dentroDoLimite) registro.chegou = true;
      continue;
    }
    if (!config) continue;

    if (!registroAnterior && config.eventos[TIPOS_NOTIFICACAO.APARECEU]) {
      eventos.push(montarEvento(TIPOS_NOTIFICACAO.APARECEU, onibus, { minutos }));
    }

    if (dentroDoLimite && !registro.chegou) {
      registro.chegou = true;
      if (config.eventos[TIPOS_NOTIFICACAO.CHEGANDO]) {
        eventos.push(montarEvento(TIPOS_NOTIFICACAO.CHEGANDO, onibus, { minutos }));
      }
    }

    const statusMudou = registroAnterior && registroAnterior.status !== registro.status;
    if (statusMudou && (registro.status === "Atrasado" || registro.status === "Adiantado")
      && config.eventos[TIPOS_NOTIFICACAO.STATUS]) {
      eventos.push(montarEvento(TIPOS_NOTIFICACAO.STATUS, onibus, { statusAnterior: registroAnterior.status, minutos }));
    }
  }

  // Quem estava no radar e não veio neste ciclo: espera a tolerância antes de dar como "saiu".
  for (const [id, registroAnterior] of Object.entries(base.registros)) {
    if (vistos.has(id)) continue;
    const ausencias = registroAnterior.ausencias + 1;
    if (ausencias < CICLOS_PARA_SAIR) {
      registros[id] = { ...registroAnterior, ausencias };
      continue;
    }
    const config = porChave.get(chaveDoOnibus(registroAnterior.onibus));
    if (!linhaDeBase && config?.eventos[TIPOS_NOTIFICACAO.SAIU]) {
      eventos.push(montarEvento(TIPOS_NOTIFICACAO.SAIU, registroAnterior.onibus));
    }
  }

  return { estado: { inicializado: true, registros }, eventos };
}

const TITULO_POR_TIPO = {
  [TIPOS_NOTIFICACAO.APARECEU]: "apareceu no radar",
  [TIPOS_NOTIFICACAO.CHEGANDO]: "chegando",
  [TIPOS_NOTIFICACAO.SAIU]: "saiu do radar",
};

function tituloDoEvento(evento) {
  const complemento = evento.tipo === TIPOS_NOTIFICACAO.STATUS
    ? String(evento.status ?? "").toLowerCase()
    : TITULO_POR_TIPO[evento.tipo];
  return `Linha ${evento.codigoLetreiro} · ${complemento}`;
}

function corpoDoEvento(evento, nomePonto) {
  const partes = [];
  if (evento.sentidoLinha) partes.push(`Sentido ${evento.sentidoLinha}`);
  if (evento.previsao) partes.push(`previsão ${evento.previsao}`);
  const ponto = nomePonto?.(evento.codigoParada);
  if (ponto) partes.push(`Ponto ${ponto}`);
  return partes.join(" · ");
}

// Transforma os eventos de um ciclo nas notificações a mostrar. `nomePonto(codigoParada)` é opcional.
// Cada notificação traz uma `tag` estável (tipo + ônibus), que a Notification API usa para não empilhar repetidas.
export function montarNotificacoes(eventos, { nomePonto, limite = LIMITE_EVENTOS_POR_CICLO } = {}) {
  if (!eventos?.length) return [];

  if (eventos.length > limite) {
    const linhas = [...new Set(eventos.map((evento) => evento.codigoLetreiro))];
    return [{
      tag: `agrupado:${eventos.map((evento) => `${evento.tipo}-${evento.id}`).join(",")}`,
      titulo: `${eventos.length} atualizações nas linhas que você segue`,
      corpo: `Linhas ${linhas.join(", ")}`,
      eventos,
    }];
  }

  return eventos.map((evento) => ({
    tag: `${evento.tipo}:${evento.id}`,
    titulo: tituloDoEvento(evento),
    corpo: corpoDoEvento(evento, nomePonto),
    eventos: [evento],
  }));
}
