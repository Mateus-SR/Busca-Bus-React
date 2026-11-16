// Service worker mínimo do Busca Bus, usado só para mostrar as notificações do sistema (no Android o navegador exige
// ServiceWorkerRegistration.showNotification) e para voltar à aba quando a pessoa toca na notificação.
// Não faz cache, não intercepta requisições (nenhum handler de fetch) e só é registrado depois que a pessoa ativa os
// avisos do sistema. Nada aqui recebe push: as notificações são criadas pela própria página.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evento) => evento.waitUntil(self.clients.claim()));

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();

  // Só abre endereços do próprio site, mesmo que `data.url` venha diferente.
  let destino = new URL("/", self.location.origin);
  try {
    const pedido = new URL(evento.notification.data?.url ?? "/", self.location.origin);
    if (pedido.origin === self.location.origin) destino = pedido;
  } catch {
    // mantém a página inicial
  }

  evento.waitUntil((async () => {
    const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const aberta = janelas.find((janela) => janela.url === destino.href)
      ?? janelas.find((janela) => new URL(janela.url).pathname === destino.pathname);
    if (aberta) return aberta.focus();
    return self.clients.openWindow(destino.href);
  })());
});
