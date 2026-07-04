// Service Worker: アプリシェルはキャッシュ優先、エピソードJSONはネットワーク優先。
// MP3は別オリジン（Releases）or リポジトリ外（../audio_out）＝スコープ外で SW 非介在。
const VERSION = "meicho-v6";
const SHELL = [
  "./", "index.html", "manifest.json", "icon.svg", "config.js",
  "css/style.css",
  "js/app.js", "js/store.js", "js/player.js", "js/ui.js", "js/avatars.js",
  "js/home.js", "js/series.js", "js/episode.js", "js/settings.js",
  "content/index.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  // エピソードJSONは新鮮さ優先（更新されうる）。初回取得後はキャッシュにも積みオフライン再訪可
  const networkFirst = url.pathname.includes("/content/");
  if (networkFirst) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => (e.request.mode === "navigate" ? caches.match("index.html") : undefined))
    )
  );
});
