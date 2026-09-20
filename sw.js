/* Intel NG Service Worker — cache images + offline, jamais l'API, HTML/JS réseau d'abord */
var CACHE = "intel-ng-v36";
var CORE = [
  "./",
  "./index.html",
  "./styles.css?v=36",
  "./manifest.json",
  "./js/cdn.js?v=36",
  "./js/store.js?v=36",
  "./js/i18n.js?v=36",
  "./js/api.js?v=36",
  "./js/validate.js?v=36",
  "./js/ui.js?v=36",
  "./js/pages.js?v=36",
  "./js/admin.js?v=36",
  "./js/main.js?v=36"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(
        CORE.map(function (u) {
          return c.add(u).catch(function () {});
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) {
            return k !== CACHE;
          })
          .map(function (k) {
            return caches.delete(k);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function (e) {
  if (!e.data) return;
  if (e.data.type === "CLEAR_CACHE") {
    e.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return caches.delete(k);
        }));
      }).then(function () {
        if (e.ports && e.ports[0]) e.ports[0].postMessage({ ok: true });
      })
    );
  }
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = e.request.url;

  /* API : jamais de cache */
  if (url.indexOf("/api/") !== -1) {
    e.respondWith(
      fetch(e.request).catch(function () {
        return new Response(JSON.stringify({ ok: false, error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  var isImg =
    /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(url) ||
    url.indexOf("/img/") !== -1 ||
    url.indexOf("register-banner") !== -1;

  /* Images : cache d'abord (3G), puis réseau */
  if (isImg) {
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        var net = fetch(e.request)
          .then(function (res) {
            if (res && res.status === 200) {
              var clone = res.clone();
              caches.open(CACHE).then(function (c) {
                c.put(e.request, clone);
              });
            }
            return res;
          })
          .catch(function () {
            return cached || caches.match("./img/machines/thumbs/cpu1.jpg");
          });
        return cached || net;
      })
    );
    return;
  }

  /* HTML / JS / CSS : réseau d'abord, cache seulement si offline */
  e.respondWith(
    fetch(e.request)
      .then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(e.request, clone);
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(e.request).then(function (c) {
          return c || caches.match("./index.html");
        });
      })
  );
});
