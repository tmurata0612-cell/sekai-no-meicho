// localStorage ラッパ。進捗はすべてここを通す（公開リポジトリには一切載らない）。
// kaizodo-fm の store.js を「完全ライブラリ型」向けに簡素化:
//   - ストリーク／図鑑スター／日次アクティビティは廃止
//   - progress[id] = {listened, resumeSec, updated, quiz:{choice,correct}}
const KEY = "meicho.v1";

const DEFAULTS = {
  settings: {
    listenerName: "あなた",
    theme: "auto",       // "auto" | "light" | "dark"
    playRate: 1.0,
    voices: {},          // ttsフォールバック用（通常は未使用）
  },
  progress: {},          // {epId: {listened:bool, resumeSec:num, updated:iso, quiz:{choice, correct}}}
  lastPlayedId: null,    // 「続きから」用
  order: { genres: null, books: {} },  // 本棚の並び順。genres=[genreKey...]、books={genreKey:[slug...]}。nullは既定順
  plates: {},            // 蔵書票: {slug: {earned: iso}}。1冊完走で1枚
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const p = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULTS), ...p,
      settings: { ...DEFAULTS.settings, ...(p.settings || {}) },
      progress: p.progress || {},
      order: { genres: p.order?.genres ?? null, books: p.order?.books || {} },
      plates: p.plates || {},
    };
  } catch { return structuredClone(DEFAULTS); }
}

function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 容量超過等は無視 */ } }

function prog(id) { return state.progress[id] || (state.progress[id] = {}); }

export const store = {
  get: () => state,
  update(fn) { fn(state); save(); },

  // ---- 進捗 ----
  getProgress(id) { return state.progress[id] || null; },
  isListened(id) { return !!state.progress[id]?.listened; },

  markListened(id) {
    const p = prog(id);
    p.listened = true;
    p.updated = new Date().toISOString();
    save();
  },

  setResume(id, sec) {
    const p = prog(id);
    p.resumeSec = Math.max(0, Math.floor(sec || 0));
    p.updated = new Date().toISOString();
    state.lastPlayedId = id;
    save();
  },
  getResume(id) { return state.progress[id]?.resumeSec || 0; },

  setLastPlayed(id) { state.lastPlayedId = id; save(); },
  lastPlayed() { return state.lastPlayedId; },

  // クイズ回答の記録（既回答は結果復元に使う）
  recordQuiz(id, choice, correct) {
    const p = prog(id);
    p.quiz = { choice, correct };
    p.updated = new Date().toISOString();
    save();
  },
  getQuiz(id) { return state.progress[id]?.quiz || null; },

  // ---- 本棚の集計（冊ごとの聴了数／コンプ判定） ----
  countsBySeries(index) {
    const out = {};
    let totalListened = 0, totalEps = 0;
    for (const s of index.series) {
      const done = s.days.filter(d => this.isListened(d.id)).length;
      out[s.slug] = { done, total: s.days.length, complete: done === s.days.length && s.days.length > 0 };
      totalListened += done;
      totalEps += s.days.length;
    }
    out._all = { done: totalListened, total: totalEps };
    return out;
  },

  // ---- 蔵書票（1冊完走＝1枚） ----
  hasPlate(slug) { return !!state.plates?.[slug]; },
  getPlate(slug) { return state.plates?.[slug] || null; },
  // 未取得なら記録して true（＝いま押した）。既取得なら false。押印演出の発火判定に使う
  earnPlate(slug) {
    if (!state.plates) state.plates = {};
    if (state.plates[slug]) return false;
    state.plates[slug] = { earned: new Date().toISOString() };
    save();
    return true;
  },
  plateCount() { return Object.keys(state.plates || {}).length; },
  // 取得順（古い順）。ホームの「直近の数枚」表示に使う
  platesEarned() {
    return Object.entries(state.plates || {})
      .sort((a, b) => String(a[1].earned).localeCompare(String(b[1].earned)))
      .map(([slug, v]) => ({ slug, earned: v.earned }));
  },

  // ---- 本棚の並び順（ユーザーがジャンル・本を並べ替え可能） ----
  getGenreOrder() { return state.order?.genres || null; },
  setGenreOrder(keys) { state.order.genres = keys.slice(); save(); },
  getBookOrder(genreKey) { return state.order?.books?.[genreKey] || null; },
  setBookOrder(genreKey, slugs) { state.order.books[genreKey] = slugs.slice(); save(); },
  resetShelfOrder() { state.order = { genres: null, books: {} }; save(); },

  // ---- バックアップ ----
  exportJson() { return JSON.stringify(state, null, 2); },
  importJson(text) {
    const p = JSON.parse(text);
    if (!p || typeof p !== "object" || !("progress" in p)) {
      throw new Error("『世界の名著』のバックアップファイルではないようです");
    }
    state = {
      ...structuredClone(DEFAULTS), ...p,
      settings: { ...DEFAULTS.settings, ...(p.settings || {}) },
      progress: p.progress || {},
      order: { genres: p.order?.genres ?? null, books: p.order?.books || {} },
      plates: p.plates || {},
    };
    save();
  },
  resetAll() { state = structuredClone(DEFAULTS); save(); },
};
