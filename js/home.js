// ホーム: ①今日のおすすめ ②続きから ③本棚（ジャンル別の棚に背表紙が並ぶ）。
// 本は背表紙メタファ。読了で金の帯が育ち、未読は箔押しラベル＋光沢スイープで「未入手の知識」に。
// 棚はジャンルごとに分かれ、木の棚板の上に本が立つ。
import { store } from "./store.js";
import { esc, GENRE_LABEL, openBook } from "./ui.js";

// ジャンルの既定表示順（棚の並び）。ユーザーが並べ替えたら store.order を優先。
const GENRE_ORDER = ["philosophy", "strategy", "science", "sciphil", "literature"];

let editMode = false; // 本棚の並べ替えモード

// 保存済みのジャンル順を、いま存在するジャンルに射影して返す（新規ジャンルは既定順で末尾へ）
function orderedGenreKeys(presentKeys) {
  const saved = store.getGenreOrder();
  const base = (saved && saved.length ? saved : GENRE_ORDER);
  const seen = new Set(), out = [];
  for (const k of base) if (presentKeys.includes(k) && !seen.has(k)) { out.push(k); seen.add(k); }
  for (const k of GENRE_ORDER) if (presentKeys.includes(k) && !seen.has(k)) { out.push(k); seen.add(k); }
  for (const k of presentKeys) if (!seen.has(k)) { out.push(k); seen.add(k); }
  return out;
}

// 著者名を背表紙用に短く（末尾の呼び名だけ。「ニッコロ・マキャベリ」→「マキャベリ」）。
function shortAuthor(name) {
  const parts = String(name || "").split(/[・･]/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : String(name || "");
}

// 背表紙は全冊いっしょの大きさ（タイトル長に依存しない）。
// 改行は index.json の titleLines（単語・助詞の切れ目のみ）に従い、
// はみ出す場合は本のサイズではなくフォントを縮めて収める。
const SPINE_W = 56;        // 厚み（一定）
const SPINE_H = 200;       // 高さ（一定）
const SPINE_FS = 14;       // タイトル字の基準サイズ
const SPINE_TITLE_H = 118; // タイトル領域の高さ（著者・話数を除いた実測余白）
const SPINE_TITLE_W = 40;  // タイトル領域の幅（縦書き列が並ぶ方向）

// titleLines の各行（縦書き1列）が領域に収まるフォントサイズを算出
function spineTitleFs(lines) {
  const maxLen = Math.max(...lines.map(s => [...s].length));
  const fitH = Math.floor(SPINE_TITLE_H / (maxLen * 1.16)); // 1列の高さ
  const fitW = Math.floor(SPINE_TITLE_W / (lines.length * 1.25)); // 列数ぶんの幅
  return Math.max(9, Math.min(SPINE_FS, fitH, fitW));
}

function bookSpine(series, counts) {
  const c = counts[series.slug] || { done: 0, total: series.days.length, complete: false };
  const lines = (series.titleLines && series.titleLines.length ? series.titleLines : [series.title]);
  const fs = spineTitleFs(lines);
  const cls = ["book", `g-${series.genreKey}`];
  if (c.complete) cls.push("is-complete");
  if (c.done === 0) cls.push("is-unread");
  else if (!c.complete) cls.push("is-reading");
  return `<button class="${cls.join(" ")}" data-slug="${esc(series.slug)}"
      style="--spine-w:${SPINE_W}px;--spine-h:${SPINE_H}px;--spine-fs:${fs}px"
      aria-label="『${esc(series.title)}』${esc(series.author)}　${c.done}/${c.total}話${c.complete ? "・読了" : c.done === 0 ? "・未読" : "・読書中"}">
    <span class="book-sheen" aria-hidden="true"></span>
    <span class="book-ribbon" aria-hidden="true"></span>
    <span class="book-title">${lines.map(esc).join("<br>")}</span>
    <span class="book-author">${esc(shortAuthor(series.author))}</span>
    <span class="book-foot">
      <span class="book-count">${c.done}<span class="slash">/</span>${c.total}</span>
    </span>
  </button>`;
}

// index.series をジャンルキーでまとめ、保存順（無ければ既定順）で並べる。本の順も保存順を反映。
function groupByGenre(seriesList) {
  const buckets = new Map();
  for (const s of seriesList) {
    const k = s.genreKey || "other";
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(s);
  }
  const keys = orderedGenreKeys([...buckets.keys()]);
  return keys.map(k => {
    let items = buckets.get(k);
    const savedB = store.getBookOrder(k);
    if (savedB) {
      const bySlug = new Map(items.map(s => [s.slug, s]));
      const ordered = [];
      for (const slug of savedB) if (bySlug.has(slug)) { ordered.push(bySlug.get(slug)); bySlug.delete(slug); }
      for (const s of items) if (bySlug.has(s.slug)) ordered.push(s); // 新規は末尾
      items = ordered;
    }
    return { key: k, label: GENRE_LABEL[k] || items[0].genre || k, items };
  });
}

function bookSpineCell(series, counts, genreKey, bi, bcount) {
  const spine = bookSpine(series, counts);
  if (!editMode) return spine;
  return `<div class="book-cell">${spine}
    <div class="book-move">
      <button class="mv" data-book-left="${esc(genreKey)}:${bi}" ${bi === 0 ? "disabled" : ""} aria-label="左へ">◀</button>
      <button class="mv" data-book-right="${esc(genreKey)}:${bi}" ${bi === bcount - 1 ? "disabled" : ""} aria-label="右へ">▶</button>
    </div></div>`;
}

function shelfUnit(group, counts, gi, gcount) {
  const done = group.items.reduce((a, s) => a + (counts[s.slug]?.done || 0), 0);
  const total = group.items.reduce((a, s) => a + (counts[s.slug]?.total || s.days.length), 0);
  const headRight = editMode
    ? `<span class="shelf-move">
        <button class="mv" data-genre-up="${gi}" ${gi === 0 ? "disabled" : ""} aria-label="ジャンルを上へ">▲</button>
        <button class="mv" data-genre-down="${gi}" ${gi === gcount - 1 ? "disabled" : ""} aria-label="ジャンルを下へ">▼</button>
       </span>`
    : `<span class="shelf-progress">${done}<span class="slash">/</span>${total}話</span>`;
  return `<div class="shelf-unit g-${group.key}">
    <div class="shelf-head">
      <span class="shelf-genre">${esc(group.label)}</span>
      ${headRight}
    </div>
    <div class="shelf-rack">
      <div class="rack-books">
        ${group.items.map((s, bi) => bookSpineCell(s, counts, group.key, bi, group.items.length)).join("")}
      </div>
      <span class="rack-plank" aria-hidden="true"></span>
    </div>
  </div>`;
}

export function renderHome(el, app) {
  const counts = store.countsBySeries(app.index);
  const all = counts._all;
  const rec = app.recommendation();
  const lastId = store.lastPlayed();
  const last = lastId ? app.dayById(lastId) : null;
  const lastResume = last ? store.getResume(lastId) : 0;

  const recSeries = rec ? rec.series : null;
  // おすすめ表紙のタイトルは縦一列で改行させない。長いものは字を縮めて収める
  const recFs = recSeries ? Math.max(8, Math.min(12, Math.floor(86 / [...recSeries.title].length))) : 12;

  el.innerHTML = `
    <header class="home-head">
      <p class="eyebrow">世界の名著</p>
      <h1 class="home-title">今日、どの一冊に触れますか</h1>
      <p class="collection">完了 <b>${all.done}</b><span class="of"> / ${all.total}話</span>
        <span class="collection-bar"><i style="width:${all.total ? (all.done / all.total * 100).toFixed(1) : 0}%"></i></span>
      </p>
    </header>

    ${rec ? `<section class="rec">
      <p class="section-label">今日のおすすめ</p>
      <button class="rec-card g-${recSeries.genreKey}" data-open="${esc(rec.id)}">
        <span class="rec-halo" aria-hidden="true"></span>
        <span class="rec-book" aria-hidden="true">
          <span class="rec-book-title" style="--rec-fs:${recFs}px">${esc(recSeries.title)}</span>
        </span>
        <span class="rec-body">
          <span class="rec-series">『${esc(recSeries.title)}』${esc(recSeries.author)}</span>
          <span class="rec-ep">${esc(rec.title)}</span>
          <span class="rec-frame">${esc(rec.frameName)}</span>
          <span class="rec-cta">この本を開く <span aria-hidden="true">›</span></span>
        </span>
      </button>
    </section>` : ""}

    ${last && lastId !== (rec && rec.id) ? `<section class="resume">
      <p class="section-label">続きから</p>
      <button class="resume-card" data-open="${esc(last.id)}">
        <span class="resume-title">『${esc(last.series.title)}』</span>
        <span class="resume-sub">${esc(last.title)}${lastResume > 5 ? `　·　${fmtTime(lastResume)}から` : ""}</span>
      </button>
    </section>` : ""}

    <section class="shelf">
      <div class="shelf-top">
        <p class="section-label">本棚 — ジャンル別</p>
        <button class="shelf-edit${editMode ? " on" : ""}" id="shelfEdit">${editMode ? "完了" : "並べ替え"}</button>
      </div>
      <div class="bookcase${editMode ? " is-editing" : ""}">
        ${(() => { const gs = groupByGenre(app.index.series); return gs.map((g, i) => shelfUnit(g, counts, i, gs.length)).join(""); })()}
      </div>
      <p class="shelf-hint">${editMode
        ? "▲▼でジャンルの棚を、◀▶で本を並べ替え。「完了」で戻ります。"
        : "まだ手にしていない本は、まだ触れていない知識。背表紙をタップして開いてください。"}</p>
    </section>

    <footer class="app-foot">
      引用はすべて番組訳＝パブリックドメイン原典からの本番組独自訳。既存の出版翻訳は不使用。<br>
      音声 VOICEVOX。<button class="link" id="toSettings">クレジット・設定</button>
    </footer>
  `;

  const rerender = () => renderHome(el, app);

  // 本棚: タップ→本を開く演出→シリーズ画面（並べ替え中は開かない）
  el.querySelectorAll(".book").forEach(b => {
    b.addEventListener("click", () => {
      if (editMode) return;
      openBook(b, () => app.navigate("series", { slug: b.dataset.slug }));
    });
  });
  // おすすめ／続きから: 開く演出→エピソード
  el.querySelectorAll("[data-open]").forEach(b => {
    b.addEventListener("click", () => {
      openBook(b, () => app.openEpisode(b.dataset.open));
    });
  });

  // 並べ替えモードの切替
  const se = el.querySelector("#shelfEdit");
  if (se) se.addEventListener("click", () => { editMode = !editMode; rerender(); });

  // ジャンルの棚を上下に動かす
  const genreKeys = () => groupByGenre(app.index.series).map(g => g.key);
  el.querySelectorAll("[data-genre-up],[data-genre-down]").forEach(btn => {
    btn.addEventListener("click", () => {
      const up = btn.hasAttribute("data-genre-up");
      const i = +(btn.getAttribute("data-genre-up") ?? btn.getAttribute("data-genre-down"));
      const keys = genreKeys();
      const j = up ? i - 1 : i + 1;
      if (j < 0 || j >= keys.length) return;
      [keys[i], keys[j]] = [keys[j], keys[i]];
      store.setGenreOrder(keys);
      rerender();
    });
  });

  // 本をシェルフ内で左右に動かす
  el.querySelectorAll("[data-book-left],[data-book-right]").forEach(btn => {
    btn.addEventListener("click", () => {
      const left = btn.hasAttribute("data-book-left");
      const [gk, biStr] = (btn.getAttribute("data-book-left") ?? btn.getAttribute("data-book-right")).split(":");
      const bi = +biStr;
      const group = groupByGenre(app.index.series).find(g => g.key === gk);
      if (!group) return;
      const slugs = group.items.map(s => s.slug);
      const j = left ? bi - 1 : bi + 1;
      if (j < 0 || j >= slugs.length) return;
      [slugs[bi], slugs[j]] = [slugs[j], slugs[bi]];
      store.setBookOrder(gk, slugs);
      rerender();
    });
  });

  const ts = el.querySelector("#toSettings");
  if (ts) ts.addEventListener("click", () => app.navigate("settings"));
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
