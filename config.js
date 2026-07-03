// アプリ全体の設定と、音声URLの解決。
//
// 音声(MP3)は容量の都合でリポジトリには入れず GitHub Releases に置く（公開後）。
// 公開前のローカル検証中は、リポジトリ外の ../audio_out/ から直接鳴らす。
//   - AUDIO.mode="local"  : `世界の名著/` をルートにローカルサーバを立て、
//                           http://localhost:PORT/app/ でアプリを開く。音声は
//                           http://localhost:PORT/audio_out/<id>.mp3 から読む。
//   - AUDIO.mode="release": ep.audio.url（Releasesの絶対URL）をそのまま使う。公開後に切替。
export const AUDIO = {
  mode: "release",           // "local" | "release"
  localBase: "../audio_out/",
};

export function audioUrlFor(ep) {
  if (!ep || !ep.audio) return null;
  if (AUDIO.mode === "release") return ep.audio.url || null;
  return `${AUDIO.localBase}${ep.id}.mp3`;
}

// VOICEVOX 利用規約により必須のクレジット（使用話者すべて）。設定画面に表示する。
export const VOICEVOX_CREDITS = [
  "九州そら", "白上虎太郎", "玄野武宏", "青山龍星", "麒ヶ島宗麟", "雀松朱司",
];
