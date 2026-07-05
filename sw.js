// Service Worker: アプリシェルはキャッシュ優先、エピソードJSONはネットワーク優先。
// MP3（audio/*.mp3）は同一オリジン配信だが SW 非介在にする＝ブラウザ標準の Range/ストリーミング
// をそのまま使わせ、iOS の <audio> がシーク・部分取得できるようにする（206をCacheに入れない）。
const VERSION = "meicho-v14";
const SHELL = [
  "./", "index.html", "manifest.json", "icon.svg", "config.js",
  "css/style.css",
  "js/app.js", "js/store.js", "js/player.js", "js/ui.js", "js/avatars.js",
  "js/home.js", "js/series.js", "js/episode.js", "js/settings.js",
  "content/index.json",
  "assets/fonts/PinyonScript-Regular.ttf", // 本を開く演出の紙面＝連綿カーシブ（SIL OFL）
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
  // 音声MP3は SW を通さずネットワーク直＝Range/シーク（iOS必須）とストリーミングを損なわない
  if (url.pathname.endsWith(".mp3")) return;

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
