// Notificações do sistema (camada 2): Notification API + service worker mínimo (public/sw.js), só no navegador.
// A página cria a notificação sozinha; não há push nem nada vindo do servidor.

const CAMINHO_SW = "/sw.js";
const ICONE = "/img/bus-svgrepo-com-256.png";

// "indisponivel" no servidor/hidratação; depois um destes:
//  "default" | "granted" | "denied" (permissão do navegador), "ios-instalar" (iPhone/iPad fora da tela inicial)
//  ou "nao-suportado" (sem Notification/service worker, ou sem HTTPS).
export function estadoNotificacoesSistema() {
  if (typeof window === "undefined") return "indisponivel";
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return ehIOS() && !instaladoNaTelaInicial() ? "ios-instalar" : "nao-suportado";
  }
  return Notification.permission;
}

function ehIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function instaladoNaTelaInicial() {
  return window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
}

const ouvintes = new Set();
const avisarOuvintes = () => ouvintes.forEach((ouvinte) => ouvinte());

// Para useSyncExternalStore: a permissão muda por clique nosso, pelas configurações do navegador (ao voltar para a aba)
// ou, em navegadores que suportam, pelo evento de mudança da Permissions API.
export function assinarEstadoNotificacoesSistema(ouvinte) {
  ouvintes.add(ouvinte);
  document.addEventListener("visibilitychange", ouvinte);
  let status = null;
  let encerrado = false;
  navigator.permissions?.query({ name: "notifications" })
    .then((resultado) => {
      if (encerrado) return;
      status = resultado;
      status.addEventListener("change", ouvinte);
    })
    .catch(() => {});
  return () => {
    encerrado = true;
    ouvintes.delete(ouvinte);
    document.removeEventListener("visibilitychange", ouvinte);
    status?.removeEventListener("change", ouvinte);
  };
}

async function obterRegistro() {
  await navigator.serviceWorker.register(CAMINHO_SW);
  return navigator.serviceWorker.ready;
}

// Precisa ser chamada de um clique: os navegadores só abrem o pedido de permissão a partir de um gesto da pessoa.
export async function ativarNotificacoesSistema() {
  if (!["default", "granted"].includes(estadoNotificacoesSistema())) return estadoNotificacoesSistema();
  const permissao = await Notification.requestPermission();
  if (permissao === "granted") await obterRegistro();
  avisarOuvintes();
  return permissao;
}

// `tag` evita empilhar a mesma notificação; tocar nela devolve o foco a esta página (public/sw.js).
export async function mostrarNotificacaoSistema({ titulo, corpo, tag }) {
  if (estadoNotificacoesSistema() !== "granted") return false;
  try {
    const registro = await obterRegistro();
    await registro.showNotification(titulo, {
      body: corpo,
      tag,
      icon: ICONE,
      data: { url: window.location.href },
    });
    return true;
  } catch {
    return false;
  }
}
