/* MIDAS 2026 — Service Worker
   Estratégia:
   - Recursos próprios (app shell): cache-first, com atualização em segundo plano.
   - Navegação (HTML): network-first com fallback para a cache (funciona offline).
   - Pedidos a terceiros (Supabase, fontes, CDN): passam à rede (não cacheados aqui).
   Os dados do utilizador são geridos pela aplicação (localStorage + fila de
   sincronização do Supabase), não pelo service worker. */
var CACHE = "midas-2026-v22";
var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./css/midas-ds.css",
  "./js/data.js",
  "./js/utils.js",
  "./js/auth.js",
  "./js/components.js",
  "./js/views.js",
  "./js/config.js",
  "./js/supabase-data.js",
  "./js/app.js",
  "./assets/logo.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // addAll falha tudo se um recurso faltar; adicionamos tolerante a falhas.
      return Promise.all(SHELL.map(function (u) {
        return c.add(u).catch(function () { /* ignora recurso em falta */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // Só tratamos pedidos da própria origem; o resto (Supabase, fontes) vai à rede.
  if (url.origin !== self.location.origin) return;

  // Navegação: network-first, cai para a cache quando offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (m) { return m || caches.match("./index.html"); });
      })
    );
    return;
  }

  // Recursos próprios (JS/CSS/imagens): NETWORK-FIRST com fallback para cache.
  // (Antes era cache-first, o que servia código velho após cada deploy enquanto
  //  online; network-first garante a versão mais recente e mantém o offline.)
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () { return caches.match(req); })
  );
});
