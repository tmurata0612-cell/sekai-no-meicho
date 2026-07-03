// エピソード画面: 台本（ラジオ）／まとめノート の2形態トグル。
// 台本は話者色＋アバター＋一節装飾。行タップで seekTo、再生に合わせて現在行をハイライト。
// まとめノートは preview/uexkull.html の noteHTML を移植（全節＋クイズ＋クロスオーバー）。
import { store } from "./store.js";
import { player, RATES } from "./player.js";
import { esc, richText, roleLabel } from "./ui.js";
import { HOST_SVG, SKEPTIC_SVG, authorGlyph, PORTRAIT_SVG } from "./avatars.js";

// 著者行のアバター（マストヘッドの肖像と揃える）: PD画像→自作SVG→グリフ
function authorAvatarHTML(ep) {
  if (ep.series.portrait) {
    const fb = (PORTRAIT_SVG[ep.series.slug] || authorGlyph(ep.series.author)).replace(/"/g, "&quot;");
    return `<img class="av-img" src="${esc(ep.series.portrait)}" alt=""
      onerror="this.outerHTML='<span class=&quot;av-svg&quot;>'+this.dataset.fb+'</span>'" data-fb="${esc(fb)}">`;
  }
  return `<span class="av-svg">${PORTRAIT_SVG[ep.series.slug] || authorGlyph(ep.series.author)}</span>`;
}

const viewState = { view: "script", forId: null };
let unsub = null;
let rafId = null;      // シークバー更新のrAF
let seekDragging = false;

function fmtClock(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// 一節の行か判定（著者セリフで末尾に「…番組訳）」「…番組）」を含む＝実引用）
function isQuoteLine(l) {
  return l.role === "author" && /（[^（）]*番組[^（）]*）\s*$/.test(l.text);
}

export function renderEpisode(el, app, { id }) {
  const ep = app.episode && app.episode.id === id ? app.episode : null;
  if (!ep) {
    // ロードされていなければロードして再描画
    app.setEpisode(id).then(ok => { if (ok) app.navigate("episode", { id }, { replace: true }); });
    el.innerHTML = `<p class="loading">開いています…</p>`;
    return;
  }
  if (unsub) { unsub(); unsub = null; }
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

  // 肖像は index.json（本棚台帳）が唯一の正。エピソードJSONのseriesには無いので補完する
  if (!ep.series.portrait) {
    const s = app.seriesBySlug(ep.series.slug);
    if (s && s.portrait) ep.series.portrait = s.portrait;
  }

  // 別のエピソードを開いたら台本ビューに戻す（同一話のトグルは維持）
  if (viewState.forId !== id) { viewState.view = "script"; viewState.forId = id; }

  const kinds = ep.kindLabel || "";
  el.innerHTML = `
    <nav class="crumb" aria-label="現在地">
      <button class="crumb-link" id="toShelf">本棚</button>
      <span class="crumb-sep" aria-hidden="true">›</span>
      <button class="crumb-link" id="toSeries">『${esc(ep.series.title)}』</button>
    </nav>
    <div class="ep-head">
      <p class="ep-kind">${esc(kinds)}</p>
      <h1 class="frame">${esc(ep.frame.name)}</h1>
      ${ep.frame.oneLine ? `<p class="frameone">${richText(ep.frame.oneLine)}</p>` : ""}
      <p class="ep-series-note">『${esc(ep.series.title)}』${esc(ep.series.author)} · 全${ep.series.totalDays}回</p>
    </div>

    <div class="toggle" role="group" aria-label="表示切替">
      <button data-v="script" aria-pressed="${viewState.view === "script"}">台本（ラジオ）</button>
      <button data-v="note" aria-pressed="${viewState.view === "note"}">まとめノート</button>
    </div>

    <div class="player" id="player">
      <div class="pl-controls">
        <button class="pl-btn" id="plPrev" aria-label="前の行">⏮</button>
        <button class="pl-btn pl-main" id="plToggle" aria-label="再生/停止">▶</button>
        <button class="pl-btn" id="plNext" aria-label="次の行">⏭</button>
        <div class="pl-rate" role="group" aria-label="再生速度">
          <button class="pl-rate-btn" id="plRateDown" aria-label="遅く">◀</button>
          <span class="pl-rate-val" id="plRateVal" aria-live="polite">×1</span>
          <button class="pl-rate-btn" id="plRateUp" aria-label="速く">▶</button>
        </div>
        ${ep.audio ? "" : '<span class="pl-note">音声準備中（読み上げ再生）</span>'}
      </div>
      ${ep.audio ? `<div class="pl-seek">
        <span class="pl-time" id="plCur">0:00</span>
        <input type="range" class="pl-bar" id="plBar" min="0" max="1000" value="0" step="1" aria-label="再生位置">
        <span class="pl-time" id="plDur">0:00</span>
      </div>` : ""}
    </div>

    <div id="epbody"></div>
  `;

  el.querySelector("#toShelf").addEventListener("click", () => app.navigate("home"));
  el.querySelector("#toSeries").addEventListener("click", () => app.navigate("series", { slug: ep.series.slug }));
  el.querySelectorAll(".toggle button").forEach(b =>
    b.addEventListener("click", () => { viewState.view = b.dataset.v; renderEpisode(el, app, { id }); }));

  // プレイヤー操作
  const toggleBtn = el.querySelector("#plToggle");
  const rateVal = el.querySelector("#plRateVal");
  const rateDown = el.querySelector("#plRateDown");
  const rateUp = el.querySelector("#plRateUp");
  el.querySelector("#plPrev").addEventListener("click", () => player.prev());
  el.querySelector("#plNext").addEventListener("click", () => player.next());
  toggleBtn.addEventListener("click", () => player.toggle());
  rateDown.addEventListener("click", () => player.cycleRate(-1));
  rateUp.addEventListener("click", () => player.cycleRate(1));

  // シークバー（音声回のみ）: ドラッグ中はプレビュー、離したらシーク。再生中はrAFで追従
  const bar = el.querySelector("#plBar");
  const curEl = el.querySelector("#plCur");
  const durEl = el.querySelector("#plDur");
  if (bar) {
    const previewTime = () => (bar.value / 1000) * (player.durationSec() || ep.audio.durationSec || 0);
    bar.addEventListener("input", () => { seekDragging = true; if (curEl) curEl.textContent = fmtClock(previewTime()); });
    const commit = () => { seekDragging = false; player.seekToSec(previewTime()); };
    bar.addEventListener("change", commit);
    const tick = () => {
      if (player.state.key === ep.id && player.state.mode === "audio") {
        const dur = player.durationSec() || ep.audio.durationSec || 0;
        const cur = player.positionSec();
        if (durEl) durEl.textContent = fmtClock(dur);
        if (!seekDragging) {
          if (dur) bar.value = Math.round((cur / dur) * 1000);
          if (curEl) curEl.textContent = fmtClock(cur);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  const body = el.querySelector("#epbody");
  body.innerHTML = viewState.view === "script" ? scriptHTML(ep) : noteHTML(ep, app);

  if (viewState.view === "script") wireScript(body, app, ep);
  else wireNote(body, ep);

  // プレイヤー状態購読（トグル文言・現在行ハイライト）
  unsub = player.subscribe((ps) => {
    if (ps.key !== ep.id) return;
    toggleBtn.textContent = ps.playing ? "⏸" : ps.finished ? "↻" : "▶";
    rateVal.textContent = `×${ps.rate}`;
    rateDown.disabled = ps.rate <= RATES[0];
    rateUp.disabled = ps.rate >= RATES[RATES.length - 1];
    if (viewState.view !== "script") return;
    const lines = body.querySelectorAll(".line");
    lines.forEach((ln, i) => ln.classList.toggle("is-now", i === ps.lineIndex && (ps.playing || ps.lineIndex > 0)));
    const now = lines[ps.lineIndex];
    if (now && ps.playing) now.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

// ---- 台本 ----
function scriptHTML(ep) {
  const mainAuthorAv = authorAvatarHTML(ep);
  const author = ep.series.author || "";
  const isMainAuthor = (name) => name === author || author.includes(name) || name.includes(author);
  const avFor = (l) => {
    if (l.role === "host") return HOST_SVG;
    if (l.role === "skeptic") return SKEPTIC_SVG;
    // 著者ロール: 当シリーズの著者なら肖像、乱入ゲストはグリフ
    return isMainAuthor(l.speaker) ? mainAuthorAv : authorGlyph(l.speaker);
  };
  return `<div class="script">` + ep.script.map((l, i) => {
    const quote = isQuoteLine(l);
    const cls = `line ${l.role}${quote ? " is-quote" : ""}`;
    return `<div class="${cls}" data-i="${i}" role="button" tabindex="0">
      <span class="av av-row ${l.role}">${avFor(l)}</span>
      <div class="content">
        <div class="spk"><span class="name">${esc(l.speaker)}</span><span class="role">${roleLabel(l.role)}</span>
          ${quote ? '<span class="qbadge">今日の一節</span>' : ""}</div>
        <div class="bubble-txt">${richText(l.text)}</div>
      </div>
    </div>`;
  }).join("") + `</div>`;
}

function wireScript(body, app, ep) {
  body.querySelectorAll(".line").forEach(ln => {
    const seek = () => { player.seekTo(+ln.dataset.i); if (!player.state.playing) player.play(); };
    ln.addEventListener("click", seek);
    ln.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seek(); } });
  });
}

// ---- まとめノート ----
function listHTML(arr, cls) {
  if (!arr || !arr.length) return "";
  return `<ul class="${cls}">` + arr.map(x => `<li>${richText(x)}</li>`).join("") + `</ul>`;
}

function tableHTML(t) {
  return `<div class="table-wrap"><table class="usemap">
    <thead><tr>${t.headers.map(h => `<th>${richText(h)}</th>`).join("")}</tr></thead>
    <tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${richText(c)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

// ---- 図解（構造化スペック → 本物の視覚図解） ----
function dgmNote(spec) {
  return spec.note ? `<p class="dgm-note">${richText(spec.note)}</p>` : "";
}
function nodeBox(n, cls) {
  const sub = n.sub ? `<span class="nb-sub">${richText(n.sub)}</span>` : "";
  return `<span class="${cls}${n.mark ? " m-" + n.mark : ""}${n.tone ? " t-" + n.tone : ""}">
    <span class="nb-t">${richText(n.t)}</span>${sub}</span>`;
}
function colBox(c) {
  const sub = c.sub ? `<span class="cb-sub">${richText(c.sub)}</span>` : "";
  const items = (c.items || []).map(x => `<li>${richText(x)}</li>`).join("");
  return `<div class="dgm-col${c.tone ? " t-" + c.tone : ""}">
    <span class="cb-t">${richText(c.t)}</span>${sub}${items ? `<ul>${items}</ul>` : ""}</div>`;
}

function diagramHTML(spec) {
  let b = "";
  switch (spec.type) {
    case "flow": {
      const arrow = spec.dir === "up" ? "↑" : "↓";
      const parts = spec.steps.map((s, i) =>
        (i ? `<span class="fl-arrow" aria-hidden="true">${arrow}</span>` : "") + nodeBox(s, "fl-step")).join("");
      const ax = spec.axis
        ? `<span class="fl-axis top">${esc(spec.axis.top)}</span>` : "";
      const axb = spec.axis
        ? `<span class="fl-axis bottom">${esc(spec.axis.bottom)}</span>` : "";
      b = `<div class="dgm dgm-flow">${ax}${parts}${axb}</div>`;
      break;
    }
    case "branch": {
      const cols = spec.cols.map(colBox).join("");
      b = `<div class="dgm dgm-branch">
        ${nodeBox(spec.root, "br-root")}
        <span class="br-stem" aria-hidden="true"></span>
        <div class="dgm-cols n${spec.cols.length}">${cols}</div></div>`;
      break;
    }
    case "compare": {
      const head = spec.head ? `<div class="cmp-head">${richText(spec.head)}</div>` : "";
      const cols = spec.cols.map(colBox).join(
        spec.rel && spec.cols.length === 2 ? `<span class="cmp-rel" aria-hidden="true">${esc(spec.rel)}</span>` : "");
      const outcome = spec.outcome
        ? `<span class="cmp-down" aria-hidden="true">↓</span>${nodeBox(spec.outcome, "cmp-outcome")}` : "";
      const cascade = spec.cascade
        ? `<div class="cmp-cascade">` + spec.cascade.map((s, i) =>
            (i ? `<span class="fl-arrow" aria-hidden="true">↓</span>` : "") +
            `<span class="casc-step">${richText(s)}</span>`).join("") + `</div>`
        : "";
      b = `<div class="dgm dgm-compare">${head}<div class="dgm-cols n${spec.cols.length}">${cols}</div>${outcome}${cascade}</div>`;
      break;
    }
    case "matrix": {
      const [r0, r1] = spec.rows, [c0, c1] = spec.cols;
      const cell = (x) => `<div class="mx-cell${x.tone ? " t-" + x.tone : ""}">
        <span class="mx-t">${richText(x.t)}</span>${x.sub ? `<span class="mx-sub">${richText(x.sub)}</span>` : ""}</div>`;
      b = `<div class="dgm dgm-matrix">
        <span class="mx-collabel">${esc(spec.colLabel)} →</span>
        <div class="mx-body">
          <span class="mx-rowlabel">${esc(spec.rowLabel)} ↓</span>
          <div class="mx-grid">
            <div class="mx-corner"></div>
            <div class="mx-hd">${esc(c0)}</div><div class="mx-hd">${esc(c1)}</div>
            <div class="mx-rh">${esc(r0)}</div>${cell(spec.cells[0][0])}${cell(spec.cells[0][1])}
            <div class="mx-rh">${esc(r1)}</div>${cell(spec.cells[1][0])}${cell(spec.cells[1][1])}
          </div>
        </div></div>`;
      break;
    }
    case "cycle": {
      const parts = spec.nodes.map((n, i) =>
        (i ? `<span class="fl-arrow" aria-hidden="true">↓</span>` : "") + nodeBox(n, "cyc-node")).join("");
      b = `<div class="dgm dgm-cycle">${parts}<span class="cyc-loop" aria-hidden="true">⟲ 輪が閉じ、対象が「その物」になる</span></div>`;
      break;
    }
    case "pairs": {
      const rows = spec.rows.map(r => `<div class="pr-row">
        <span class="pr-l">${richText(r.l)}</span>
        <span class="pr-rel" aria-hidden="true">${esc(r.rel || "")}<span class="pr-arw">→</span></span>
        <span class="pr-r">${richText(r.r)}</span></div>`).join("");
      const conds = spec.conds
        ? `<div class="pr-conds">` + spec.conds.map(c => `<div class="pr-cond">
            <span class="pc-if">${richText(c.if)}</span><span class="pc-arw" aria-hidden="true">→</span>
            <span class="pc-then">${richText(c.then)}</span></div>`).join("") + `</div>`
        : "";
      b = `<div class="dgm dgm-pairs"><div class="pr-rows">${rows}</div>${conds}</div>`;
      break;
    }
    default:
      return "";
  }
  return b + dgmNote(spec);
}

function noteHTML(ep, app) {
  const n = ep.note;
  let h = "";
  h += `<section><h3>今日のフレーム</h3><p class="frame nf">${esc(ep.frame.name)}</p>
    <div class="lead">${richText(n.definition).replaceAll("\n", "<br>")}</div></section>`;

  if (n.reading?.length) {
    h += `<section><h3>原典を読む — 抄</h3><div class="genten">` +
      n.reading.map(g => `<div class="g"><q>${esc(g.quote)}</q>${g.annotation ? `<span class="n">${richText(g.annotation)}</span>` : ""}</div>`).join("") +
      `</div></section>`;
  }
  if (n.mechanism?.length) h += `<section><h3>メカニズム</h3>${listHTML(n.mechanism, "clean")}</section>`;
  if (n.examples?.length) h += `<section><h3>事例</h3>${listHTML(n.examples, "clean")}</section>`;
  if (n.diagramSpec) {
    // spec.note が原典キャプションを内包するため、旧ASCIIキャプションは重複ゆえ出さない
    h += `<section><h3>図解</h3>${diagramHTML(n.diagramSpec)}</section>`;
  } else if (n.diagram) {
    h += `<section><h3>図解</h3><pre class="zukai">${esc(n.diagram)}</pre>${n.diagramCaption ? `<p class="zukai-cap">${richText(n.diagramCaption)}</p>` : ""}</section>`;
  }
  if (ep.crossover) {
    h += `<section><h3>この回の乱入ゲスト</h3><div class="xover">
      <p class="xo-who">${esc(ep.crossover.guestAuthor)}</p>
      <p class="xo-recap">${richText(ep.crossover.recap)}</p>
      <p class="xo-ref">${esc(ep.crossover.reference)}<br><span class="xo-note">※ 本話は未聴でも自己完結して読めます。</span></p>
    </div></section>`;
  }
  if (n.useCasesTable) h += `<section><h3>使いどころ</h3>${tableHTML(n.useCasesTable)}</section>`;
  else if (n.useCases?.length) h += `<section><h3>使いどころ</h3>${listHTML(n.useCases, "clean")}</section>`;
  if (n.limits?.length) h += `<section><h3>限界・効かない条件</h3>${listHTML(n.limits, "clean")}</section>`;
  if (n.context?.length) h += `<section><h3>時代背景</h3>${listHTML(n.context, "clean")}</section>`;

  // インストール確認（3択）
  if (n.install && n.install.question) {
    const q = n.install;
    const saved = store.getQuiz(ep.id);
    h += `<section><h3>インストール確認</h3><div class="quiz${saved ? " done" : ""}" data-quiz data-answer="${esc(q.answer)}" data-ep="${esc(ep.id)}">
      <p class="q">${richText(app.fillVars(q.question))}</p>
      <div class="opts">` +
      ["A", "B", "C"].filter(k => q.options[k]).map(k =>
        `<button class="opt${saved ? optClass(k, q.answer, saved.choice) : ""}" data-k="${k}">
          <span class="lab">${k}</span>${richText(q.options[k])}</button>`).join("") +
      `</div>
      <div class="explains">${richText(q.explanation).replaceAll("\n", "<br>")}</div>
      <p class="hint">${saved ? "" : "選択肢をタップで解説を表示"}</p>
    </div></section>`;
  }

  // 卒業クイズ
  if (n.grad?.length) {
    h += `<section><h3>卒業クイズ — 間隔反復</h3><div class="grad">` +
      n.grad.map((g, i) => `<details><summary><span class="qn">Q${i + 1}</span><span>${richText(g.question)}</span></summary>
        <div class="ans">${g.answer ? `<p class="grad-ans">正解フレーム: <b>${esc(g.answer)}</b></p>` : ""}${richText(g.detail).replaceAll("\n", "<br>")}</div></details>`).join("") +
      `</div></section>`;
  }

  if (n.nextPreview) {
    h += `<div class="next"><p class="l">次の一冊 / 次の回</p><p>${richText(n.nextPreview)}</p></div>`;
  }
  return `<div class="note">${h}</div>`;
}

function optClass(k, answer, choice) {
  if (k === answer) return " correct";
  if (k === choice) return " wrong";
  return " dim";
}

function wireNote(body, ep) {
  body.querySelectorAll("[data-quiz]").forEach(qz => {
    const answer = qz.dataset.answer;
    const epId = qz.dataset.ep;
    qz.querySelectorAll(".opt").forEach(op => {
      op.addEventListener("click", () => {
        if (qz.classList.contains("done")) return;
        qz.classList.add("done");
        const choice = op.dataset.k;
        qz.querySelectorAll(".opt").forEach(o => {
          const k = o.dataset.k;
          o.classList.add(k === answer ? "correct" : k === choice ? "wrong" : "dim");
        });
        const hint = qz.querySelector(".hint"); if (hint) hint.textContent = "";
        store.recordQuiz(epId, choice, choice === answer);
      });
    });
  });
}
