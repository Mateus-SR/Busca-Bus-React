export { converteHoraMinuto, minutosAteChegar, minutosDoDiaEmSaoPaulo } from "./time.js";
export { calcularStatus } from "./status.js";
export { formatarDuracao } from "./duracao.js";
export { EVENTOS, EVENTOS_SOCKET } from "./eventos.js";
export { INTERVALO_COLETA_MS } from "./intervalos.js";
export { validarEmail, validarSenha } from "./schemas.js";
export { normalizarExibicao, normalizarOnibus } from "./dto.js";
export { ehFalhaTransitoriaApi, ehStatusTransitorioApi, aguardarDisponibilidadeApi } from "./api/disponibilidade.js";
export { TIPOS_EVENTO, LOCAIS_EVENTO, LOCAIS_COM_NUMERO, ROLES_ADMIN, ehAdmin } from "./calendario.js";
export { AREA_SAO_PAULO, coordenadaValida, dentroDeSaoPaulo, distanciaMetros, limitesDoRaio, formatarDistancia } from "./geo.js";
export {
  TIPOS_NOTIFICACAO,
  MINUTOS_CHEGANDO_OPCOES,
  MINUTOS_CHEGANDO_PADRAO,
  CICLOS_PARA_SAIR,
  LIMITE_EVENTOS_POR_CICLO,
  EVENTOS_SEGUIDA_PADRAO,
  chaveSeguida,
  chaveDoOnibus,
  normalizarConfigSeguida,
  criarSeguida,
  listarSeguidas,
  criarEstadoDeteccao,
  detectarEventos,
  montarNotificacoes,
} from "./notificacoes.js";
