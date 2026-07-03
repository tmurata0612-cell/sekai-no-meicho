// 話者アバター（自作SVG原画・著作権リスクゼロ）。円形クリップは .av コンテナ側で行う。
// シオリ／アラタは preview/uexkull.html の原画を移植。著者ゲストは肖像画像が無い場合の
// フォールバックとして、明朝イニシャルの汎用グリフを描く（PD肖像はアプリ側で portrait に差す）。

export const HOST_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#e7e5f7"/><path d="M12 64c0-12 9-17 20-17s20 5 20 17Z" fill="#5b5470"/><rect x="27" y="42" width="10" height="9" rx="4" fill="#e9c9a3"/><ellipse cx="32" cy="31" rx="16" ry="17" fill="#3f3654"/><ellipse cx="32" cy="33" rx="12.3" ry="14" fill="#eccaa0"/><path d="M20 27q12-12 24 0 q-1-13-12-13 q-11 0-12 13z" fill="#3f3654"/><path d="M23 28.5q3-2 6 0" stroke="#6a5f7d" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M35 28.5q3-2 6 0" stroke="#6a5f7d" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="26" cy="33" r="1.7" fill="#43413f"/><circle cx="38" cy="33" r="1.7" fill="#43413f"/><path d="M28.5 39q3.5 2.5 7 0" stroke="#c98f74" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;

export const SKEPTIC_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#f7e4da"/><path d="M12 64c0-12 9-17 20-17s20 5 20 17Z" fill="#46464f"/><rect x="27" y="42" width="10" height="9" rx="4" fill="#e9c9a3"/><ellipse cx="32" cy="32" rx="12.5" ry="14.5" fill="#eccaa0"/><path d="M18.5 30c0-11 6-17 13.5-17s13.5 6 13.5 17c-3-6-7-7-13.5-7s-10.5 1-13.5 7z" fill="#2f2b33"/><path d="M23 28l6 1.6" stroke="#2f2b33" stroke-width="1.8" stroke-linecap="round"/><path d="M41 28l-6 1.6" stroke="#2f2b33" stroke-width="1.8" stroke-linecap="round"/><circle cx="26" cy="32.6" r="1.7" fill="#43413f"/><circle cx="38" cy="32.6" r="1.7" fill="#43413f"/><path d="M28 39.5h8" stroke="#c98f74" stroke-width="1.5" stroke-linecap="round"/></svg>`;

// 実在肖像が無い/PD確認できない著者の自作SVG肖像（著作権リスクゼロの原画）。
// ユクスキュル: preview/uexkull.html の原画（禿頭＋白い口ひげの老紳士）を移植。
export const UEXKULL_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#d7eef1"/><path d="M11 64c0-13 9-19 21-19s21 6 21 19Z" fill="#3c4a5e"/><path d="M27 50l5 7 5-7z" fill="#e9edf2"/><rect x="27" y="41" width="10" height="10" rx="4" fill="#dcb488"/><ellipse cx="32" cy="29" rx="17" ry="17" fill="#c6cbd4"/><ellipse cx="32" cy="31" rx="13.5" ry="15.5" fill="#eccaa0"/><ellipse cx="32" cy="21" rx="12.5" ry="11" fill="#eccaa0"/><circle cx="18.6" cy="32" r="2.6" fill="#e2bf98"/><circle cx="45.4" cy="32" r="2.6" fill="#e2bf98"/><rect x="22" y="26.6" width="7" height="2.2" rx="1.1" fill="#aab0ba"/><rect x="35" y="26.6" width="7" height="2.2" rx="1.1" fill="#aab0ba"/><circle cx="25.6" cy="31.2" r="1.7" fill="#43413f"/><circle cx="38.4" cy="31.2" r="1.7" fill="#43413f"/><path d="M32 32l-2.2 5h4.4z" fill="#dcb079"/><path d="M22 38q10-4 20 0 0 5-10 4-10 1-10-4z" fill="#c3c8d1"/></svg>`;

// 孫武: 同時代の肖像は存在しない。古代中国の将のイメージで自作（冠・髭・鎧）。
export const SUNWU_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#dfe1e6"/><path d="M9 64c0-12 10-18 23-18s23 6 23 18Z" fill="#3a3f4a"/><path d="M20 46l12 8 12-8-3-6H23z" fill="#5a6070"/><rect x="27" y="40" width="10" height="9" rx="4" fill="#d9ad82"/><ellipse cx="32" cy="30" rx="13" ry="14.5" fill="#e2b788"/><path d="M19 25c0-9 6-14 13-14s13 5 13 14c-2-6-6-8-13-8s-11 2-13 8z" fill="#2b2b30"/><rect x="22.5" y="8.5" width="19" height="6" rx="2" fill="#6b5a34"/><rect x="30.5" y="4.5" width="3" height="6" rx="1.5" fill="#8a7440"/><path d="M24 27.5l6 1.2M40 27.5l-6 1.2" stroke="#2b2b30" stroke-width="1.7" stroke-linecap="round"/><circle cx="26.5" cy="31" r="1.7" fill="#3a3a3a"/><circle cx="37.5" cy="31" r="1.7" fill="#3a3a3a"/><path d="M27 37q5 3 10 0l-2 6q-3 2-6 0z" fill="#4a4a52"/><path d="M28 37h8" stroke="#7a5a3a" stroke-width="1.3" stroke-linecap="round"/></svg>`;

// slug → 自作SVG肖像（実在PD肖像を持たない著者）。
export const PORTRAIT_SVG = {
  "02-sonshi": SUNWU_SVG,
  "03-uexkull": UEXKULL_SVG,
};

// 著者ゲストの汎用グリフ（PD肖像が無い/読み込めない時のフォールバック）。
// 明朝イニシャル1文字を古書の箔押し風に。引数は表示名。
export function authorGlyph(name) {
  const ch = (name || "著").trim().charAt(0);
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#e8ddc6"/><rect x="3" y="3" width="58" height="58" rx="6" fill="none" stroke="#b9a26a" stroke-width="1.4"/><text x="32" y="42" text-anchor="middle" font-family="'Shippori Mincho','Yu Mincho',serif" font-size="30" font-weight="600" fill="#6b5a34">${ch}</text></svg>`;
}
