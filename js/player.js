// グローバル再生エンジン。画面遷移しても再生が続く唯一の場所。
// UI(radio.js / ミニプレイヤー)は subscribe で状態を受け取って描画するだけ。
//
// 二段構え:
//   - audioモード: エピソードに radio.audio(事前生成MP3)があれば <audio> で再生。
//     バックグラウンド再生・ロック画面操作(Media Session)に対応する本命。
//   - ttsモード: audio が無い過去回は従来の speechSynthesis で読み上げ(後方互換)。
// 公開API(load/play/pause/toggle/seekTo/next/prev/setRate/cycleRate/subscribe)は
// 両モードで共通。UI側はモードを意識しない。
import { store } from "./store.js";

export const RATES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

const listeners = new Set();
let gen = 0; // 世代カウンタ: cancel後に届く古いonendを無視する(ttsモード)

const state = {
  key: null,          // エピソードキー(book-slug-dayN)
  mode: "tts",        // "audio" | "tts"
  title: "",
  author: "",         // 著者名(Media Session用)
  seriesTitle: "",    // シリーズ名(Media Session用)
  script: [],         // [{speaker, text}] 変数置換済み
  chars: {},          // 話者→ロール等のメタ(この番組では未使用でも後方互換)
  voiceOverrides: {}, // settings.voices(ttsモードのみ有効)
  lineIndex: 0,
  playing: false,
  finished: false,
  rate: store.get().settings.playRate || 1.0,
  onComplete: null,
};

function emit() { listeners.forEach(cb => { try { cb(state); } catch { /* UI側の例外は無視 */ } }); }
function clampRate(r) { return Math.max(0.25, Math.min(4, r || 1)); }

// ============================================================
//  audioモード(事前生成MP3 + <audio> + Media Session)
// ============================================================
let audioEl = null;   // 遅延生成する <audio> 要素
let lineStarts = [];  // radio.audio.lineStartSec
let audioDur = 0;     // radio.audio.durationSec
let seekPending = -1; // メタデータ待ちのシーク先index（-1＝なし）。timeupdateの巻き戻し抑止に使う

function ensureAudioEl() {
  if (audioEl) return audioEl;
  audioEl = new Audio();
  // 全体を先読みして「シーク可能」にする。ローカルの python http.server は Range 非対応で、
  // preload=metadata だと未バッファ位置へのシークが効かず先頭に戻る（GitHub Pages は Range 可）。
  audioEl.preload = "auto";
  audioEl.addEventListener("timeupdate", onTimeUpdate);
  audioEl.addEventListener("ended", () => { if (state.mode === "audio") finish(); });
  audioEl.addEventListener("play", () => {
    if (state.mode !== "audio") return;
    state.playing = true;
    document.body.classList.add("is-playing");
    emit();
  });
  audioEl.addEventListener("pause", () => {
    if (state.mode !== "audio" || state.finished) return;
    state.playing = false;
    document.body.classList.remove("is-playing");
    emit();
  });
  return audioEl;
}

// 指定秒 t が現在シーク可能な範囲に入っているか（Range非対応サーバでの先読み待ち判定）
function seekableCovers(t) {
  if (!audioEl) return false;
  const s = audioEl.seekable;
  for (let k = 0; k < s.length; k++) {
    if (t >= s.start(k) - 0.25 && t <= s.end(k) + 0.25) return true;
  }
  return false;
}

// 音声ソースを設定。blob指定時は丸ごとメモリに載せて完全シーク可能にする。
// python http.server は Range 非対応で、通常読み込みでは seekable=[0,0] になりシークできないため。
function setAudioSource(a, audio, key) {
  if (a._obj) { URL.revokeObjectURL(a._obj); a._obj = null; }
  if (audio.blob) {
    fetch(audio.url).then(r => r.blob()).then(b => {
      if (state.key !== key) return; // 別の話に切替済みなら破棄
      a._obj = URL.createObjectURL(b);
      a.src = a._obj; a.load();
    }).catch(() => { a.src = audio.url; a.load(); });
  } else {
    a.src = audio.url; a.load();
  }
}

// t 秒へシーク。未バッファならバッファ進捗を待って再試行（seekPending中は行を動かさない）
function applySeek(t) {
  if (!audioEl) return;
  if (audioEl.readyState >= 1 && (t <= 0.5 || seekableCovers(t))) {
    try { audioEl.currentTime = t; } catch { /* noop */ }
    seekPending = -1;
    return;
  }
  const retry = () => { if (seekPending >= 0) applySeek(t); };
  audioEl.addEventListener("loadedmetadata", retry, { once: true });
  audioEl.addEventListener("progress", retry, { once: true });
  audioEl.addEventListener("canplay", retry, { once: true });
}

// lineStarts(昇順)で t 以下の最大 index を二分探索。
// +0.1s の許容: シークやMP3フレーム境界の丸めで currentTime が行頭の直前に着地しても、
// 直前の行にハイライトが戻らないようにする（体感上のズレ防止）
function lineIndexForTime(t) {
  const tt = t + 0.1;
  let lo = 0, hi = lineStarts.length - 1, ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lineStarts[mid] <= tt) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}

function onTimeUpdate() {
  if (state.mode !== "audio" || !audioEl) return;
  if (seekPending >= 0) { updateMediaPos(); return; } // シーク適用待ちは行を動かさない
  const i = lineIndexForTime(audioEl.currentTime);
  if (i !== state.lineIndex) { state.lineIndex = i; emit(); }
  updateMediaPos();
}

// --- Media Session(ロック画面・通知・Bluetooth操作) ---
function setupMediaSession() {
  if (!("mediaSession" in navigator)) return;
  const ms = navigator.mediaSession;
  ms.setActionHandler("play", () => player.play());
  ms.setActionHandler("pause", () => player.pause());
  ms.setActionHandler("previoustrack", () => player.prev());
  ms.setActionHandler("nexttrack", () => player.next());
  try { ms.setActionHandler("seekbackward", () => player.prev()); } catch { /* 未対応 */ }
  try { ms.setActionHandler("seekforward", () => player.next()); } catch { /* 未対応 */ }
}

function updateMediaMeta() {
  if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.title || "世界の名著",
      artist: state.author ? `${state.author}（世界の名著）` : "世界の名著",
      album: state.seriesTitle || "世界の名著",
    });
  } catch { /* 環境により未対応 */ }
}

function updateMediaPos() {
  if (!("mediaSession" in navigator) || state.mode !== "audio" || !audioEl) return;
  const dur = audioEl.duration || audioDur;
  if (!dur || !isFinite(dur)) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: dur,
      playbackRate: audioEl.playbackRate,
      position: Math.min(audioEl.currentTime, dur),
    });
  } catch { /* setPositionState 未対応 */ }
}

// ============================================================
//  ttsモード(speechSynthesis。audioが無い過去回の後方互換)
// ============================================================
function voiceScore(v) {
  const n = (v.name || "").toLowerCase();
  let s = 0;
  if (/natural|ニューラル|neural/.test(n)) s += 400;   // Edgeのオンライン自然音声
  if (/google/.test(n)) s += 250;                       // Google TTS
  if (/enhanced|premium|拡張/.test(n)) s += 200;        // iOSの拡張音声
  if (/siri/.test(n)) s += 180;
  if (/kyoko|otoya|o-ren|hattori/.test(n)) s += 150;    // iOS標準のまともな声
  if (/haruka|ichiro|ayumi|sayaka|desktop/.test(n)) s -= 100; // Windowsの旧SAPI声
  return s;
}

function rankedJaVoices() {
  return speechSynthesis.getVoices()
    .filter(v => v.lang?.toLowerCase().startsWith("ja"))
    .sort((a, b) => voiceScore(b) - voiceScore(a));
}

function pickVoice(charId) {
  const saved = state.voiceOverrides[charId]?.voiceURI;
  const voices = speechSynthesis.getVoices();
  if (saved) {
    const v = voices.find(v => v.voiceURI === saved);
    if (v) return v;
  }
  const ranked = rankedJaVoices();
  if (!ranked.length) return null;
  const order = Object.keys(state.chars);
  return ranked[Math.min(order.indexOf(charId), ranked.length - 1)] || ranked[0];
}

function speakFrom(i) {
  if (!state.playing) return;
  if (i >= state.script.length) { finish(); return; }
  const myGen = ++gen;
  state.lineIndex = i;
  emit();
  const line = state.script[i];
  const conf = state.chars[line.speaker]?.voice || {};
  const u = new SpeechSynthesisUtterance(line.text);
  const v = pickVoice(line.speaker);
  if (v) u.voice = v;
  u.lang = "ja-JP";
  u.pitch = state.voiceOverrides[line.speaker]?.pitch ?? conf.pitch ?? 1;
  u.rate = Math.min(10, (conf.rate ?? 1) * state.rate);
  const advance = () => {
    if (myGen !== gen || !state.playing) return;
    speakFrom(i + 1);
  };
  u.onend = advance;
  u.onerror = advance;
  speechSynthesis.speak(u);
}

// ============================================================
//  共通
// ============================================================
function finish() {
  state.playing = false;
  state.finished = true;
  document.body.classList.remove("is-playing");
  const cb = state.onComplete;
  state.onComplete = null; // 完了は1回だけ
  emit();
  if (cb) cb(state.key);
}

const hasTts = typeof window !== "undefined" && "speechSynthesis" in window;
const hasAudio = typeof Audio !== "undefined";

export const player = {
  state,
  supported: hasTts || hasAudio,
  subscribe(cb) { listeners.add(cb); cb(state); return () => listeners.delete(cb); },

  // 同じエピソードなら位置を保持、別エピソードならロードし直す
  // audio(= ep.audio)があれば audioモード、なければ ttsモード
  load({ key, title, author, seriesTitle, script, chars, voiceOverrides, onComplete, audio, startSec }) {
    state.chars = chars || {};
    state.voiceOverrides = voiceOverrides || {};
    if (state.key === key) { state.onComplete = state.onComplete || onComplete; emit(); return; }
    this.pause();
    state.key = key;
    state.title = title;
    state.author = author || "";
    state.seriesTitle = seriesTitle || "";
    state.script = script;
    state.lineIndex = 0;
    state.finished = false;
    state.onComplete = onComplete;
    seekPending = -1;

    if (audio && audio.url && Array.isArray(audio.lineStartSec) && audio.lineStartSec.length) {
      state.mode = "audio";
      lineStarts = audio.lineStartSec;
      audioDur = audio.durationSec || 0;
      const a = ensureAudioEl();
      a.playbackRate = clampRate(state.rate);
      // 続きから: 保存位置を行頭にスナップして復帰（シークは applySeek がバッファ待ちして適用）
      const resumeIdx = (startSec && startSec > 1 && (!audioDur || startSec < audioDur - 2))
        ? lineIndexForTime(startSec) : 0;
      if (resumeIdx) { state.lineIndex = resumeIdx; seekPending = resumeIdx; }
      setAudioSource(a, audio, key);
      if (resumeIdx) applySeek(lineStarts[resumeIdx] ?? 0);
      updateMediaMeta();
    } else {
      state.mode = "tts";
      lineStarts = [];
      audioDur = 0;
      if (audioEl) { audioEl.pause(); audioEl.removeAttribute("src"); audioEl.load(); }
    }
    emit();
  },

  // 現在の再生位置(秒)。resume保存用。audioモードのみ意味を持つ
  positionSec() { return state.mode === "audio" && audioEl ? audioEl.currentTime || 0 : 0; },
  durationSec() { return state.mode === "audio" ? (audioEl && audioEl.duration && isFinite(audioEl.duration) ? audioEl.duration : audioDur) : 0; },

  // シークバー用: 絶対秒へシーク（現在行も対応する行に更新）
  seekToSec(t) {
    if (state.mode !== "audio" || !audioEl) return;
    state.finished = false;
    const dur = this.durationSec() || 0;
    const clamped = Math.max(0, dur ? Math.min(t, dur) : t);
    const idx = lineStarts.length ? lineIndexForTime(clamped) : 0;
    state.lineIndex = idx;
    seekPending = idx;
    applySeek(clamped);
    emit();
    updateMediaPos();
  },

  play() {
    if (state.mode === "audio") {
      if (!audioEl) return;
      if (state.finished) { state.finished = false; state.lineIndex = 0; audioEl.currentTime = 0; }
      audioEl.playbackRate = clampRate(state.rate);
      setupMediaSession();
      updateMediaMeta();
      state.playing = true;
      document.body.classList.add("is-playing");
      emit();
      audioEl.play().catch(() => { /* 自動再生ブロック等。UIの再タップで復帰 */ });
      return;
    }
    // ttsモード
    if (!hasTts || !state.script.length) return;
    if (state.finished) { state.finished = false; state.lineIndex = 0; }
    state.playing = true;
    document.body.classList.add("is-playing");
    emit();
    const start = () => speakFrom(state.lineIndex);
    if (!speechSynthesis.getVoices().length) {
      speechSynthesis.addEventListener("voiceschanged", start, { once: true });
      setTimeout(() => { if (state.playing && !speechSynthesis.speaking) start(); }, 400);
    } else {
      start();
    }
  },

  pause() {
    if (state.mode === "audio") {
      state.playing = false;
      if (audioEl) audioEl.pause();
      document.body.classList.remove("is-playing");
      emit();
      return;
    }
    // ttsモード
    state.playing = false;
    gen++;
    if (hasTts) speechSynthesis.cancel();
    document.body.classList.remove("is-playing");
    emit();
  },

  toggle() { state.playing ? this.pause() : this.play(); },

  seekTo(i) {
    const idx = Math.max(0, Math.min(state.script.length - 1, i));
    state.finished = false;
    if (state.mode === "audio") {
      if (audioEl && lineStarts.length) {
        // 先読み未完でシークが効かない問題に対応。seekPending中は timeupdate で行を戻さない
        seekPending = idx;
        applySeek(lineStarts[idx] ?? 0);
      }
      state.lineIndex = idx;
      emit();
      updateMediaPos();
      return;
    }
    // ttsモード
    if (state.playing) {
      gen++;
      speechSynthesis.cancel();
      state.playing = true;
      speakFrom(idx);
    } else {
      state.lineIndex = idx;
      emit();
    }
  },

  next() { this.seekTo(state.lineIndex + 1); },
  prev() { this.seekTo(state.lineIndex - 1); },

  setRate(r) {
    state.rate = r;
    store.update(s => { s.settings.playRate = r; });
    if (state.mode === "audio") {
      if (audioEl) audioEl.playbackRate = clampRate(r);
      emit();
      updateMediaPos();
      return;
    }
    if (state.playing) this.seekTo(state.lineIndex); // 現在の行から新しい速度で読み直す
    else emit();
  },

  cycleRate(dir) {
    const i = RATES.indexOf(state.rate);
    const base = i === -1 ? RATES.indexOf(1.0) : i;
    const next = RATES[Math.max(0, Math.min(RATES.length - 1, base + dir))];
    this.setRate(next);
    return next;
  },
};
