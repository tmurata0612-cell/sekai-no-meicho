// 蔵書票（別画面）。1冊完走で1枚が見返しに押され、ここへジャンル別に溜まっていく。
// 空きマスがそのまま「まだ読んでいない本」＝次への引き。総数は content/index.json の plan（選書リストの写し）。
import { store } from "./store.js";
import { esc } from "./ui.js";
import { EMBLEM, PLATE, hasPlate } from "./emblems.js";

// 計画が index.json に無い場合の保険（古いキャッシュ対策）。公開済み分だけで器を作る
const FALLBACK_PLAN = { totalBooks: 66, genres: [] };

export function plan(app) {
  const p = app.index?.plan;
  return (p && Array.isArray(p.genres) && p.genres.length) ? p : FALLBACK_PLAN;
}

// 票1枚（グリッド用の小さい面／big=儀式・詳細用の大きい面）
export function plateHTML(series, big = false) {
  const meta = PLATE[series.slug];
  const em = EMBLEM[series.slug] || "";
  return `<div class="${big ? "big-plate" : "plate"} g-${esc(series.genreKey)}">
    <span class="exl">EX LIBRIS</span>
    <svg viewBox="0 0 80 70" aria-hidden="true">${em}</svg>
    <span class="pt">${esc(series.title)}</span>
    <span class="cap">${esc(meta ? meta.cap : "")}</span>
  </div>`;
}

// 完走済みで、かつ紋章が用意されている本だけが票になる
function earnedSeries(app) {
  const bySlug = new Map((app.index?.series || []).map(s => [s.slug, s]));
  return store.platesEarned()
    .map(p => bySlug.get(p.slug))
    .filter(s => s && hasPlate(s.slug));
}

export function plateStats(app) {
  return { got: earnedSeries(app).length, total: plan(app).totalBooks };
}

export function renderPlates(el, app) {
  const got = earnedSeries(app);
  const P = plan(app);
  const byGenre = new Map();
  for (const s of got) {
    if (!byGenre.has(s.genreKey)) byGenre.set(s.genreKey, []);
    byGenre.get(s.genreKey).push(s);
  }

  const sections = P.genres.map(g => {
    const mine = byGenre.get(g.key) || [];
    const cells = mine.map(s =>
      `<button class="slot filled" data-slug="${esc(s.slug)}"
        aria-label="『${esc(s.title)}』の蔵書票を開く">${plateHTML(s)}</button>`);
    for (let i = mine.length; i < g.books; i++) {
      cells.push(`<div class="slot g-${esc(g.key)}" aria-hidden="true">未取得</div>`);
    }
    return `<section class="genre-sec g-${esc(g.key)}">
      <div class="genre-head">
        <span class="genre-name">${esc(g.label)}</span>
        <span class="count">${mine.length}<span class="slash">/</span>${g.books} 枚</span>
      </div>
      <div class="pgrid">${cells.join("")}</div>
    </section>`;
  }).join("");

  el.innerHTML = `
    <header class="plates-head">
      <button class="crumb-solo" id="toHome">‹ ホーム</button>
      <h1 class="plates-title">蔵書票</h1>
      <p class="plates-n"><b>${got.length}</b><span class="of"> / ${P.totalBooks} 枚</span>
        <span class="collection-bar"><i style="width:${P.totalBooks ? (got.length / P.totalBooks * 100).toFixed(1) : 0}%"></i></span>
      </p>
      <p class="plates-lead">1冊を最後まで聴き終えると、その本だけの蔵書票が1枚。
        空いたマスが、まだ読んでいない本です。</p>
    </header>
    ${sections}
    <p class="plates-foot">紋章は、その本の各話がすでに持つ図解から採っています。票をタップすると出典が出ます。</p>
  `;

  el.querySelector("#toHome").addEventListener("click", () => app.navigate("home"));
  el.querySelectorAll(".slot.filled").forEach(b => {
    b.addEventListener("click", () => openPlateSheet(app.seriesBySlug(b.dataset.slug)));
  });
}

// 票の詳細（タップで開くシート）
export function openPlateSheet(series) {
  if (!series) return;
  const meta = PLATE[series.slug] || {};
  const rec = store.getPlate(series.slug);
  const d = rec?.earned ? new Date(rec.earned) : null;
  const when = d && !isNaN(d) ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 完走` : "完走済み";
  const sheet = document.createElement("div");
  sheet.className = "sheet on";
  sheet.innerHTML = `<div class="sheet-in" role="dialog" aria-modal="true" aria-label="『${esc(series.title)}』の蔵書票">
    ${plateHTML(series, true)}
    <p class="sheet-frame">${esc(meta.frame || "")}</p>
    <p class="sheet-meta">${esc(series.author)}　·　${esc(when)}</p>
    <p class="sheet-src">${esc(meta.src || "")}</p>
    <button class="sheet-close">閉じる</button>
  </div>`;
  const close = () => { sheet.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = e => { if (e.key === "Escape") close(); };
  sheet.addEventListener("click", e => { if (e.target === sheet || e.target.classList.contains("sheet-close")) close(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(sheet);
  sheet.querySelector(".sheet-close").focus();
}

// 押印の儀式。1冊完走した瞬間に呼ばれる。終わったら蔵書票の画面へ送り出す
export function stampRitual(app, series, onDone) {
  const P = plan(app);
  const n = store.plateCount();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ov = document.createElement("div");
  ov.className = "stamp-ov on";
  ov.innerHTML = `<div>
    <div class="endpaper">${plateHTML(series, true)}</div>
    <div class="stamp-cap">
      <p class="k">蔵書票を、見返しに押しました</p>
      <p class="s">${String(n).padStart(2, "0")} / ${P.totalBooks} 枚目　—　『${esc(series.title)}』</p>
      ${n === 1 ? `<p class="s first">蔵書票——自分の本だと示すために、見返しに貼る小さな紙です。</p>` : ""}
    </div>
  </div>`;
  document.body.appendChild(ov);
  const finish = () => { ov.remove(); onDone && onDone(); };
  ov.addEventListener("click", finish);
  setTimeout(finish, reduced ? 400 : 2600);
}
