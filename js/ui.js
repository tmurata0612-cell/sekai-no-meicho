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
  literature: "文学", sciphil: "科学哲学", economy: "経済",
};

// 本を開く演出の紙面に敷く写本テキスト＝実在のパブリックドメイン文章
// （フランシス・ベーコン『随想集』1625・著作権消滅。"Of Studies" 他の随想から採録）。
// 連綿カーシブ（Pinyon Script）で描く装飾。<s>…</s>は見せ消し（取り消し線）で書簡感を出す。
const BACON_ESSAYS = [
  'Studies serve for delight, for ornament, and for ability.',
  'Their chief use for delight is in privateness and retiring; for ornament, is in discourse; and for ability, is in the judgment and disposition of business.',
  'To spend too much time in studies is sloth; to use them too much for ornament, is affectation.',
  'Crafty men contemn studies, simple men admire them, and wise men use them.',
  'Read not to contradict and confute; nor to believe and take for granted; but to weigh and consider.',
  'Some books are to be tasted, others to be swallowed, and some few to be chewed and digested.',
  'Reading maketh a full man; conference a ready man; and writing an exact man.',
  'Histories make men wise; poets witty; the mathematics subtile; natural philosophy deep; moral grave.',
  'What is truth? said jesting Pilate; and would not <s>stay</s> stay for an answer.',
  'Truth is a naked and open daylight, that doth not show the masks of the world half so stately.',
  'Prosperity is the blessing of the Old Testament; adversity is the blessing of the New.',
  'The virtue of prosperity is temperance; the virtue of adversity is fortitude.',
  'Prosperity is not without many fears and distastes; and adversity is not without comforts and hopes.',
  'A crowd is not company, and faces are but a gallery of pictures.',
  'It redoubleth joys, and cutteth griefs in halves; for there is no man that imparteth his joys to his friend, but he joyeth the more.',
  'Men in great place are thrice servants: servants of the sovereign, servants of fame, and servants of business.',
  'It is a strange desire, to seek power and to lose liberty; or to seek power over others, and to lose power over a man’s self.',
  'Revenge is a kind of wild justice; which the more man’s nature runs to, the more ought law to weed it out.',
  'He that hath wife and children hath given hostages to fortune; for they are impediments to great enterprises.',
  'Travel, in the younger sort, is a part of education; in the elder, a part of experience.',
  'I cannot call riches better than the baggage of virtue; for as the baggage is to an army, so is riches to virtue.',
  'Discretion of speech is more than eloquence; and to speak agreeably to him with whom we deal is more than to speak in good words.',
  'Nature is often hidden; sometimes overcome; seldom extinguished.',
  'A man that is young in years may be old in hours, if he have lost no time.',
];
// 面ごとに別の箇所から結合し、各ページの文面を変える。ページをびっしり埋める（overflow hidden で余りは切れる）。信頼済み文字列のみ。
function scrHTML(face) {
  const n = BACON_ESSAYS.length;
  const start = (face * 4) % n;                 // 面ごとに開始位置をずらす＝別内容
  return Array.from({ length: 16 }, (_, k) => BACON_ESSAYS[(start + k) % n]).join(" ");
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
  // ①閉じた本が正面へ → ②表紙がゆっくり開く＋見開き幅へ → ③中間ページが綴じを軸にきれいにめくれる → ④本の世界へダイブ（光エフェクトなし） → ⑤遷移
  // （本全体は .bo-float でゆっくり浮遊。紙面は Pinyon Script の連綿カーシブ＝PD文章をびっしり）
  const RIFFLE = 2; // めくる中間ページ枚数
  // 面ごとに固有の scrHTML インデックス（0..）を割り当て＝どの面も別の文面になる
  // 割当: 右ページ=0／中間ページ表裏=2,3,4,5／表紙裏(左ページ)=1
  const rpHtml = Array.from({ length: RIFFLE }, (_, i) =>
    `<div class="bo-rp"><div class="rp-f"><div class="bo-scr">${scrHTML(2 + i * 2)}</div></div>` +
    `<div class="rp-b"><div class="bo-scr l">${scrHTML(3 + i * 2)}</div></div></div>`).join("");
  overlay.innerHTML = `<div class="bo-float"><div class="bo-book ${genre}">
    <div class="bo-page-r" aria-hidden="true"><div class="bo-scr">${scrHTML(0)}</div></div>
    ${rpHtml}
    <div class="bo-leaf">
      <div class="bo-face bo-front"><span class="bo-cover-title">${esc(title)}</span></div>
      <div class="bo-face bo-back" aria-hidden="true"><div class="bo-scr l">${scrHTML(1)}</div></div>
    </div>
  </div></div>`;
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
    setTimeout(() => book.classList.add("open"), 360);  // 表紙が開く＋見開き幅へ
    // 中間ページ2枚を短間隔で連続して勢いよくめくる＝パラパラっとしたリフル
    const delays = [620, 740];
    rps.forEach((rp, i) => {
      setTimeout(() => { rp.style.zIndex = String(101 + i); rp.classList.add("turn"); }, delays[i] ?? (740 + i * 120));
    });
    setTimeout(() => book.classList.add("dive"), 1300); // 見開きへ深くズームして本の世界に入り込む（光なし）
  });
  book.addEventListener("transitionend", (e) => {
    if (e.propertyName === "transform" && book.classList.contains("dive")) finish();
  });
  setTimeout(finish, 2450); // 保険
}
