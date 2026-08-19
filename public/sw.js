self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Sem cache de páginas autenticadas: o PWA funciona como app instalado,
// mas os dados do CRM continuam sempre vindo da sessão segura do servidor.
self.addEventListener("fetch", (event) => {
  if (event.request.method === "GET") {
    event.respondWith(fetch(event.request));
  }
});
