// 起動・画面遷移（履歴つき）・エピソード解決と再生・ミニプレイヤー・テーマ。
// 完全ライブラリ型: ホーム（今日のおすすめ＋続きから＋本棚）→ シリーズ → エピソード。
import { store } from "./store.js";
import { player, RATES } from "./player.js";
import { audioUrlFor, AUDIO } from "../config.js";
import { renderHome } from "./home.js";
import { renderSeries } from "./series.js";
import { renderEpisode } from "./episode.js";
import { renderSettings } from "./settings.js";

const app = {
  store, player,
  index: null,           // content/index.json（本棚台帳）
  episode: null,         // 現在ロード中のエピソードJSON
  navigate, goBack, setEpisode, openEpisode,

  // 全エピソードをフラットに（{...day, series}）
  allDays() {
    const out = [];
    for (const s of this.index?.series || []) {
      for (const d of s.days) out.push({ ...d, series: s });
    }
    return out;
  },
  seriesBySlug(slug) { return (this.index?.series || []).find(s => s.slug === slug); },
  dayById(id) { return this.allDays().find(d => d.id === id) || null; },

  // 表示用テキストのプレースホルダ置換（音声は make_audio.py 側で中立化済み）
  fillVars(text) {
    const name = store.get().settings.listenerName || "あなた";
    return String(text)
      .replaceAll("連続{{streak}}日目のあなたも、", "")
      .replaceAll("{{streak}}", "")
      .replaceAll("{{listener}}", name);
  },

  // 今日のおすすめ: 日付決定的・未聴優先（聴くほど候補が縮む）
  recommendation() {
    const all = this.allDays();
    if (!all.length) return null;
    const unheard = all.filter(d => !store.isListened(d.id));
    const pool = unheard.length ? unheard : all;
    const dayNum = Math.floor(Date.now() / 86400000);
    return pool[dayNum % pool.length];
  },
};

// ---- エピソードのロード ----
async function setEpisode(id) {
  const meta = app.dayById(id);
  if (!meta) return false;
  const ep = await fetchJson(`content/${meta.series.slug}/${id}.json`, true);
  if (!ep) return false;
  app.episode = ep;
  loadIntoPlayer(ep);
  return true;
}

function loadIntoPlayer(ep) {
  const startSec = store.getResume(ep.id);
  player.load({
    key: ep.id,
    title: ep.title,
    author: ep.series.author,
    seriesTitle: ep.series.title,
    script: ep.script.map(l => ({ ...l, text: app.fillVars(l.text) })),
    // local配信はRange非対応サーバ対策で丸ごとblob化してシーク可能に（release=GitHubはRange可なので直接）
    audio: ep.audio ? { ...ep.audio, url: audioUrlFor(ep), blob: AUDIO.mode === "local" } : null,
    startSec,
    onComplete: (id) => {
      store.markListened(id);
      if (current.name === "episode") navigate("episode", { id }, { replace: true });
    },
  });
  store.setLastPlayed(ep.id);
}

// エピソードを開く（本棚/シリーズから）: ロード→画面遷移
async function openEpisode(id) {
  const ok = await setEpisode(id);
  if (ok) navigate("episode", { id });
}

// ---- ナビゲーション ----
const views = { home: renderHome, series: renderSeries, episode: renderEpisode, settings: renderSettings };
let current = { name: "home", params: {} };
let history = [];

function navigate(name, params = {}, { replace = false } = {}) {
  if (!replace && current.name) history = [...history.slice(-12), current];
  current = { name, params };
  document.body.classList.toggle("on-episode", name === "episode");
  const el = document.getElementById("view");
  el.innerHTML = "";
  el.classList.remove("fade-in");
  void el.offsetWidth;
  el.classList.add("fade-in");
  views[name](el, app, params);
  window.scrollTo(0, 0);
  updateMiniPlayer(player.state);
}

function goBack() {
  const prev = history.pop() || { name: "home", params: {} };
  navigate(prev.name, prev.params, { replace: true });
}

async function fetchJson(url, fresh = false) {
  try {
    const res = await fetch(url, fresh ? { cache: "no-cache" } : {});
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ---- ミニプレイヤー（全画面共通の再生コントロール） ----
function updateMiniPlayer(ps) {
  const bar = document.getElementById("miniPlayer");
  if (!bar) return;
  const started = ps.key && (ps.playing || ps.lineIndex > 0 || ps.finished);
  const show = started && current.name !== "episode";
  bar.hidden = !show;
  if (!show) return;
  bar.querySelector("#mpToggle").textContent = ps.playing ? "⏸" : "▶";
  bar.querySelector("#mpRate").textContent = `×${ps.rate}`;
  bar.querySelector("#mpRateDown").disabled = ps.rate <= RATES[0];
  bar.querySelector("#mpRateUp").disabled = ps.rate >= RATES[RATES.length - 1];
  const line = ps.script[ps.lineIndex];
  bar.querySelector("#mpTitle").textContent = ps.finished
    ? `▸ ${ps.title}（聴了）`
    : line ? `${line.speaker}：${line.text.slice(0, 24)}…` : ps.title;
}

function setupMiniPlayer() {
  const bar = document.getElementById("miniPlayer");
  bar.querySelector("#mpToggle").addEventListener("click", () => player.toggle());
  bar.querySelector("#mpPrev").addEventListener("click", () => player.prev());
  bar.querySelector("#mpNext").addEventListener("click", () => player.next());
  bar.querySelector("#mpTitle").addEventListener("click", () => {
    if (player.state.key) navigate("episode", { id: player.state.key });
  });
  // 速度: エピソード画面と同じ ◀▶ 両方向
  bar.querySelector("#mpRateDown").addEventListener("click", () => player.cycleRate(-1));
  bar.querySelector("#mpRateUp").addEventListener("click", () => player.cycleRate(1));
  player.subscribe(updateMiniPlayer);

  // resume を間引き保存（再生中5秒ごと＋pause時）
  let lastSave = 0;
  player.subscribe((ps) => {
    if (ps.mode !== "audio" || !ps.key) return;
    const now = Date.now();
    if (ps.playing && now - lastSave > 5000) {
      lastSave = now;
      store.setResume(ps.key, player.positionSec());
    } else if (!ps.playing && !ps.finished) {
      store.setResume(ps.key, player.positionSec());
    }
  });
  window.addEventListener("pagehide", () => {
    if (player.state.mode === "audio" && player.state.key) {
      store.setResume(player.state.key, player.positionSec());
    }
  });
}

// ---- テーマ ----
export function applyTheme() {
  const t = store.get().settings.theme || "auto";
  const root = document.documentElement;
  if (t === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
}

function setupChrome() {
  document.getElementById("btnSettings").addEventListener("click", () => navigate("settings"));
  document.getElementById("btnHome").addEventListener("click", () => navigate("home"));
  setupMiniPlayer();
  applyTheme();
}

async function boot() {
  setupChrome();
  app.index = await fetchJson("content/index.json", true);
  if (!app.index) {
    document.getElementById("view").innerHTML =
      `<p style="padding:40px;text-align:center;color:var(--ink-faint)">蔵書を読み込めませんでした。<br>content/index.json を確認してください。</p>`;
    return;
  }
  navigate("home", {}, { replace: true });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

boot();
