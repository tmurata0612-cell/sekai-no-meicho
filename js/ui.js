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

// 本を開く演出の紙面に敷く写本テキスト＝実在のパブリックドメイン文章
// （フランシス・ベーコン『随想集』"Of Studies" 1625・読書についての名文。著作権消滅）。
// 連綿カーシブ（Pinyon Script）で描く装飾。<s>…</s>は見せ消し（取り消し線）で書簡感を出す。
const STUDY_POOL = [
  'Studies serve for delight, for ornament, and for ability. Their chief use for delight is in privateness and retiring; for ornament, is in discourse.',
  'To spend too much time in studies is sloth; to use them too much for ornament, is affectation; <s>to make</s> to make the judgment wholly by their rules, is the humour of a scholar.',
  'Crafty men contemn studies, simple men admire them, and wise men use them; for they teach not their own use; but that is a wisdom without them, and above them, won by observation.',
  'Read not to contradict and confute; nor to believe and take for granted; nor to find talk and discourse; but to weigh and consider.',
  'Some books are to be tasted, others to be swallowed, and some few to be chewed and digested; that is, some books are to be read only in parts.',
  'Reading maketh a full man; conference a ready man; and writing an exact man. <s>Histories</s> Histories make men wise; poets witty; the mathematics subtile.',
];
// 面ごとに連続する数スニペットを結合して埋める（overflow hidden で自然にラグド）。信頼済み文字列のみ。
function scrHTML(i) {
  const n = STUDY_POOL.length;
  return [0, 1, 2].map(k => STUDY_POOL[(i + k) % n]).join(" ");
}

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
  // ①閉じた本が正面へ → ②表紙がゆっくり開く＋見開き幅へ → ③中間ページが浮きながらふんわり舞う → ④本の世界へダイブ → ⑤遷移
  // （本全体は .bo-float でゆっくり浮遊。紙面は Pinyon Script の連綿カーシブ＝PD文章）
  const RIFFLE = 5; // ふんわり舞う中間ページ枚数
  const rpHtml = Array.from({ length: RIFFLE }, (_, i) =>
    `<div class="bo-rp"><div class="rp-f"><div class="bo-scr">${scrHTML(i)}</div></div>` +
    `<div class="rp-b"><div class="bo-scr l">${scrHTML(i + 3)}</div></div></div>`).join("");
  overlay.innerHTML = `<div class="bo-float"><div class="bo-book ${genre}">
    <div class="bo-rays" aria-hidden="true"></div>
    <div class="bo-page-r" aria-hidden="true"><div class="bo-scr">${scrHTML(1)}</div></div>
    ${rpHtml}
    <div class="bo-glow" aria-hidden="true"></div>
    <div class="bo-leaf">
      <div class="bo-face bo-front"><span class="bo-cover-title">${esc(title)}</span></div>
      <div class="bo-face bo-back" aria-hidden="true"><div class="bo-scr l">${scrHTML(4)}</div></div>
    </div>
  </div></div>`;
  document.body.appendChild(overlay);

  const book = overlay.querySelector(".bo-book");
  const rps = Array.from(overlay.querySelectorAll(".bo-rp"));
  // 初期の重なり（右側で上から：表紙→中間ページ→…→最終右ページ。光条は最背面、光は紙面の上） */
  overlay.querySelector(".bo-rays").style.zIndex = "0";
  overlay.querySelector(".bo-page-r").style.zIndex = "1";
  rps.forEach((rp, i) => { rp.style.zIndex = String(20 - i); });
  overlay.querySelector(".bo-glow").style.zIndex = "2";
  overlay.querySelector(".bo-leaf").style.zIndex = "30";

  let done = false;
  const finish = () => { if (done) return; done = true; overlay.remove(); onDone(); };
  overlay.addEventListener("click", finish); // 途中タップでスキップ

  requestAnimationFrame(() => {
    overlay.classList.add("in");                        // 閉じた本が正面へ
    setTimeout(() => book.classList.add("open"), 380);  // 表紙がゆっくり開く＋見開き幅へ
    // ふんわり：中間ページを綴じ軸に、重なりの深い不均一な間で浮かせながら舞わせる（最後ほど間を詰めて収束）
    const delays = [600, 820, 1010, 1170, 1300];
    rps.forEach((rp, i) => {
      setTimeout(() => { rp.style.zIndex = String(101 + i); rp.classList.add("turn"); }, delays[i] ?? (1300 + i * 90));
    });
    setTimeout(() => book.classList.add("dive"), 1780); // 本の世界へダイブ
  });
  book.addEventListener("transitionend", (e) => {
    if (e.propertyName === "transform" && book.classList.contains("dive")) finish();
  });
  setTimeout(finish, 2450); // 保険
}
