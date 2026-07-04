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
  // 開く演出の表紙に載せるタイトル。本棚＝.book-title、おすすめ＝.rec-book-title、
  // 続きから＝.resume-title（『』つき）。装丁名として『』は外す。
  const rawTitle = bookEl.querySelector(".book-title")?.textContent
    || bookEl.querySelector(".rec-book-title")?.textContent
    || bookEl.querySelector(".resume-title")?.textContent
    || bookEl.querySelector(".rec-series")?.textContent || "";
  const title = rawTitle.replace(/[『』]/g, "");

  const overlay = document.createElement("div");
  overlay.className = "book-opening";
  // ①閉じた本が正面へ → ②表紙が開く＋見開き幅へ → ③中間ページをパラパラめくって真ん中へ着地 → ④本の世界へズームイン → ⑤遷移
  const RIFFLE = 6; // パラパラめくる中間ページ枚数
  const rpHtml = Array.from({ length: RIFFLE },
    () => `<div class="bo-rp"><div class="rp-f"></div><div class="rp-b"></div></div>`).join("");
  overlay.innerHTML = `<div class="bo-book ${genre}">
    <div class="bo-page-r" aria-hidden="true"></div>
    ${rpHtml}
    <div class="bo-leaf">
      <div class="bo-face bo-front"><span class="bo-cover-title">${esc(title)}</span></div>
      <div class="bo-face bo-back" aria-hidden="true"></div>
    </div>
  </div>`;
  document.body.appendChild(overlay);

  const book = overlay.querySelector(".bo-book");
  const rps = Array.from(overlay.querySelectorAll(".bo-rp"));
  // 初期の重なり（右側で上から：表紙→中間ページ→…→最終右ページ）
  overlay.querySelector(".bo-page-r").style.zIndex = "1";
  rps.forEach((rp, i) => { rp.style.zIndex = String(20 - i); });
  overlay.querySelector(".bo-leaf").style.zIndex = "30";

  let done = false;
  const finish = () => { if (done) return; done = true; overlay.remove(); onDone(); };
  overlay.addEventListener("click", finish); // 途中タップでスキップ

  requestAnimationFrame(() => {
    overlay.classList.add("in");                        // 閉じた本が正面へ
    setTimeout(() => book.classList.add("open"), 320);  // 表紙が開く＋見開き幅へ（1枚目のめくり）
    // パラパラ：中間ページを綴じ軸に素早く順にめくる。めくり始めに最前面へ→左の束の一番上に着地
    rps.forEach((rp, i) => {
      setTimeout(() => { rp.style.zIndex = String(101 + i); rp.classList.add("turn"); }, 470 + i * 55);
    });
    setTimeout(() => book.classList.add("dive"), 1450); // 本の世界へズームイン（総尺は不変）
  });
  book.addEventListener("transitionend", (e) => {
    if (e.propertyName === "transform" && book.classList.contains("dive")) finish();
  });
  setTimeout(finish, 2300); // 保険
}
