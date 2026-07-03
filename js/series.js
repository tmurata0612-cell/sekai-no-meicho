// シリーズ画面: 著者カード（肖像＋MC/懐疑役）＋ 全Dayの一覧。
import { store } from "./store.js";
import { esc, GENRE_LABEL, avatarSVG } from "./ui.js";
import { HOST_SVG, SKEPTIC_SVG, authorGlyph, PORTRAIT_SVG } from "./avatars.js";

const KIND_JA = {
  "author-intro": "著者登場", frame: "フレーム", rebuttal: "反論特集",
  practice: "実戦適用", crossover: "乱入",
};

export function renderSeries(el, app, { slug }) {
  const s = app.seriesBySlug(slug);
  if (!s) { el.innerHTML = "<p>見つかりませんでした。</p>"; return; }

  // 肖像: ①PD画像があれば <img>（読込失敗時は自作SVG/グリフにフォールバック）
  //       ②画像を持たない著者は自作SVG肖像（PORTRAIT_SVG）③無ければ汎用グリフ
  const fallbackSvg = PORTRAIT_SVG[s.slug] || authorGlyph(s.author);
  const portrait = s.portrait
    ? `<img class="av-img" src="${esc(s.portrait)}" alt="${esc(s.author)}"
         onerror="this.outerHTML='<span class=&quot;av-svg&quot;>'+this.dataset.fb+'</span>'"
         data-fb="${esc(fallbackSvg).replace(/"/g, "&quot;")}">`
    : `<span class="av-svg">${fallbackSvg}</span>`;

  el.innerHTML = `
    <button class="crumb-solo" id="back">‹ 本棚へ</button>
    <header class="masthead g-${s.genreKey}">
      <span class="mh-glow" aria-hidden="true"></span>
      <p class="eyebrow">On Air · 夜の対談</p>
      <h1 class="mh-title">${esc(s.title)}</h1>
      <div class="authorcard">
        <span class="av av-lg author">${portrait}</span>
        <div>
          <div class="byline"><span>著者 <b class="who">${esc(s.author)}</b></span></div>
          <div class="byline tags">
            <span class="tag genre">${esc(GENRE_LABEL[s.genreKey] || s.genre)}</span>
            <span class="tag">全${s.totalDays}回</span>
            <span class="tag">10–15分/回</span>
          </div>
        </div>
      </div>
      <div class="byline crew-row">
        <span class="crew"><span class="av av-sm host">${HOST_SVG}</span>MC <b class="who host-c">シオリ</b></span>
        <span class="crew"><span class="av av-sm skeptic">${SKEPTIC_SVG}</span>懐疑役 <b class="who skeptic-c">アラタ</b></span>
      </div>
    </header>

    <ol class="daylist">
      ${s.days.map(d => dayRow(d)).join("")}
    </ol>
  `;

  el.querySelector("#back").addEventListener("click", () => app.navigate("home"));
  el.querySelectorAll(".dayrow").forEach(r => {
    r.addEventListener("click", () => app.openEpisode(r.dataset.id));
  });
}

function dayRow(d) {
  const listened = store.isListened(d.id);
  const kinds = d.kind.map(k => KIND_JA[k] || k).join("・");
  return `<li>
    <button class="dayrow ${listened ? "is-listened" : ""}" data-id="${esc(d.id)}">
      <span class="dr-day">${d.day}</span>
      <span class="dr-main">
        <span class="dr-title">${esc(d.title)}</span>
        <span class="dr-frame">${esc(d.frameName)}</span>
        <span class="dr-kind">${esc(kinds)}${d.crossover ? ' <span class="dr-x">乱入あり</span>' : ""}</span>
      </span>
      <span class="dr-mark" aria-hidden="true">${listened ? "◆" : "▷"}</span>
    </button>
  </li>`;
}
