// アプリ全体の設定と、音声URLの解決。
//
// 音声(MP3)の配信元。
//   - AUDIO.mode="pages"  : 同一オリジン（GitHub Pages）の audio/<id>.mp3 から鳴らす【本番】。
//                           Releases配信は Content-Type=application/octet-stream＋
//                           Content-Disposition=attachment となり iOS Safari が
//                           インライン再生を拒否する（＝iPhoneで聞けない）ため同一オリジンに移行。
//                           Pages は audio/mpeg・インライン・Range 対応で iOS でも再生できる。
//   - AUDIO.mode="release": ep.audio.url（Releasesの絶対URL）。※iOS非対応。旧方式・緊急退避用。
//   - AUDIO.mode="local"  : ローカル検証。`世界の名著/` をルートにサーバを立て http://localhost:PORT/app/。
//                           音声は http://localhost:PORT/audio_out/<id>.mp3。
export const AUDIO = {
  mode: "pages",             // "pages" | "release" | "local"
  localBase: "../audio_out/",
};

export function audioUrlFor(ep) {
  if (!ep || !ep.audio) return null;
  if (AUDIO.mode === "pages") return `audio/${ep.id}.mp3`;
  if (AUDIO.mode === "release") return ep.audio.url || null;
  return `${AUDIO.localBase}${ep.id}.mp3`;
}

// VOICEVOX 利用規約により必須のクレジット（使用話者すべて）。設定画面に表示する。
export const VOICEVOX_CREDITS = [
  "九州そら", "白上虎太郎", "玄野武宏", "青山龍星", "麒ヶ島宗麟", "雀松朱司",
];
