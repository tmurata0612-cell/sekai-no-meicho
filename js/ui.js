// 共有ユーティリティ: HTMLエスケープ、話者ロール、装丁色、アバター、本オープン演出。
import { HOST_SVG, SKEPTIC_SVG, authorGlyph } from "./avatars.js";

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// まとめノート本文は **bold** を許すが、それ以外のHTMLは通さない。
// 生データは番組が用意した信頼済みテキスト。**…**／<b>…</b> のみ太字化し、他はエスケープ。
export function richText(s) {
  const escaped = esc(s).replace(/&lt;(\/?)b&gt;/g, "<$1b>");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

export function roleLabel(role) {
  return role === "host" ? "MC" : role === "skeptic" ? "懐疑役" : "著者";
}

// 話者名→アバターSVG。著者は肖像優先、無ければグリフ。
export function avatarSVG(role, speaker) {
  if (role === "host") return HOST_SVG;
  if (role === "skeptic") return SKEPTIC_SVG;
  return authorGlyph(speaker);
}

// ジャンル装丁色キー → 日本語ラベル（本のタグ表示用）
export const GENRE_LABEL = {
  philosophy: "哲学", strategy: "歴史", science: "科学",
  literature: "文学", sciphil: "科学哲学",
};

// 本を開く演出（「本が開く」＝正面の本が3Dで立ち上がり、表紙がゆっくり開いて中身が現れる）。
// prefers-reduced-motion では演出をスキップして即 onDone。途中タップでスキップ可。CSS 3Dのみ。
export function openBook(bookEl, onDone) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !bookEl) { onDone(); return; }

  const genre = [...(bookEl.classList || [])].find(c => c.startsWith("g-")) || "g-philosophy";
  const title = bookEl.querySelector(".book-title")?.textContent
    || bookEl.querySelector(".rec-book-title")?.textContent
    || bookEl.querySelector(".rec-series")?.textContent || "";

  const overlay = document.createElement("div");
  overlay.className = "book-opening";
  // ①正面の表紙 → ②見開き（左右のページ）に開く → ③本の世界へ飛び込む（ズームイン）→ ④遷移
  overlay.innerHTML = `<div class="bo-book ${genre}">
    <div class="bo-page-r" aria-hidden="true"></div>
    <div class="bo-leaf">
      <div class="bo-face bo-front"><span class="bo-cover-title">${esc(title)}</span></div>
      <div class="bo-face bo-back" aria-hidden="true"></div>
    </div>
  </div>`;
  document.body.appendChild(overlay);

  const book = overlay.querySelector(".bo-book");

  let done = false;
  const finish = () => { if (done) return; done = true; overlay.remove(); onDone(); };
  overlay.addEventListener("click", finish); // 途中タップでスキップ

  requestAnimationFrame(() => {
    overlay.classList.add("in");                        // 暗転＋表紙が正面へ立ち上がる（ここは従来速度）
    setTimeout(() => book.classList.add("open"), 560);  // 見開きに開く（以降1.5倍速）
    setTimeout(() => book.classList.add("dive"), 1450); // 本の世界へズームイン
  });
  book.addEventListener("transitionend", (e) => {
    if (e.propertyName === "transform" && book.classList.contains("dive")) finish();
  });
  setTimeout(finish, 2300); // 保険
}
