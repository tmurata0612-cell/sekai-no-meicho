// 蔵書票（Ex Libris）の紋章と銘。1冊完走で1枚。
//
// ★ルール（2026-07-15 ユーザー決定。破ると捏造が混じる）:
//   紋章は絵を新規に発明しない。その本の各話がすでに持つ「図解コンセプト」から
//   一番強い1つを選んで描く。cap（絵の一言）と frame（フレーム）は、
//   紋章を採ったのと同じ回から採る。src にその出典を残す。
//   frame は content/index.json の該当話の frameName と完全一致させること。
//
// この規則が無かった初版では、10枚中4枚が誤っていた（セネカに砂時計＝1世紀に無い道具、
// イワン・イリイチに蝋燭＝本文に存在しない、孫子に竹簡＝伝来の話でフレームではない、
// マクベスに短剣＝本文に無い）。絵を思いつきで当てると必ずこうなる。

const S = 'stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

function rays(cx, cy, r1, r2, n) {
  let o = "";
  for (let i = 0; i < n; i++) {
    const a = i * 2 * Math.PI / n;
    o += `<line x1="${(cx + Math.cos(a) * r1).toFixed(1)}" y1="${(cy + Math.sin(a) * r1).toFixed(1)}"`
      + ` x2="${(cx + Math.cos(a) * r2).toFixed(1)}" y2="${(cy + Math.sin(a) * r2).toFixed(1)}"/>`;
  }
  return o;
}

// viewBox は全枚 "0 0 80 70"。描画は必ずこの中に収める（check_plates.mjs が検査する）。
export const EMBLEM = {
  /* 君主論 Day5 図解「狐とライオン（脅威2種×能力2種）」 */
  "01-kunshuron": `<g ${S}><path d="M12 44l4-11 4 4h6l4-4 4 11-11 7z"/><circle cx="24" cy="41" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="56" cy="38" r="10"/><g stroke-width="1.1">${rays(56, 38, 11, 16, 10)}</g>
    <circle cx="53" cy="36" r="1.1" fill="currentColor" stroke="none"/><circle cx="59" cy="36" r="1.1" fill="currentColor" stroke="none"/></g>`,

  /* 孫子 Day2 図解「攻めの四段（コストの階段）」— 段を下るほど点（コスト）が増え、
     最上策＝戦わないことは階段の外（点線の先の○） */
  "02-sonshi": `<g ${S}><path d="M14 24h11v10h11v10h11v10h11v7"/>
    <path d="M14 24L6.5 13" stroke-dasharray="3 2.5"/><circle cx="5" cy="11" r="3"/>
    <g fill="currentColor" stroke="none" opacity=".8"><circle cx="19.5" cy="20" r="1.4"/>
      <circle cx="28.5" cy="30" r="1.4"/><circle cx="32.5" cy="30" r="1.4"/>
      <circle cx="38.5" cy="40" r="1.4"/><circle cx="41.5" cy="40" r="1.4"/><circle cx="44.5" cy="40" r="1.4"/>
      <circle cx="48.5" cy="50" r="1.4"/><circle cx="51.5" cy="50" r="1.4"/><circle cx="54.5" cy="50" r="1.4"/><circle cx="57.5" cy="50" r="1.4"/></g></g>`,

  /* 生物から見た世界 Day1 図解「環世界＝シャボン玉（ダニの三標識／複数の泡）」 */
  "03-uexkull": `<g ${S}><circle cx="40" cy="36" r="24" stroke-width="1.1" opacity=".65"/>
    <ellipse cx="40" cy="38" rx="7" ry="9"/><ellipse cx="40" cy="27" rx="3" ry="2.5"/>
    <g stroke-width="1.1"><path d="M33 32l-7-4M33 38h-8M33 44l-7 4M47 32l7-4M47 38h8M47 44l7 4"/></g></g>`,

  /* イワン・イリイチの死 Day1 図解「間違った壁の梯子」— 登りきった先が、間違った壁。
     左の点線＝掛けるべきだった本物の壁 */
  "04-ivan-ilyich": `<g ${S}><rect x="46" y="8" width="13" height="54"/>
    <g stroke-width=".8" opacity=".45"><line x1="46" y1="21" x2="59" y2="21"/><line x1="46" y1="35" x2="59" y2="35"/><line x1="46" y1="49" x2="59" y2="49"/></g>
    <g stroke-dasharray="3 2.5" opacity=".5"><rect x="8" y="28" width="12" height="34"/></g>
    <line x1="24" y1="62" x2="40" y2="12"/><line x1="30" y1="62" x2="46" y2="12"/>
    <g stroke-width="1.1"><line x1="26.4" y1="54.5" x2="32.4" y2="54.5"/><line x1="29.6" y1="44.5" x2="35.6" y2="44.5"/>
      <line x1="32.8" y1="34.5" x2="38.8" y2="34.5"/><line x1="36" y1="24.5" x2="42" y2="24.5"/></g>
    <circle cx="43" cy="8" r="3"/><line x1="4" y1="62" x2="76" y2="62" stroke-width="1.6"/></g>`,

  /* ノヴム・オルガヌム Day2 図解「4つの偶像（種族・洞窟・市場・劇場）」 */
  "05-novum-organum": `<g ${S}><g stroke-width="1" opacity=".45">
      <rect x="8" y="8" width="28" height="25" rx="2"/><rect x="44" y="8" width="28" height="25" rx="2"/>
      <rect x="8" y="37" width="28" height="25" rx="2"/><rect x="44" y="37" width="28" height="25" rx="2"/></g>
    <circle cx="22" cy="17" r="4.5"/><path d="M15 29c1.5-5 12.5-5 14 0"/>
    <path d="M50 29v-7a8 8 0 0 1 16 0v7"/><circle cx="58" cy="24" r="2" fill="currentColor" stroke="none"/>
    <path d="M14 46h13m-3.5-3.5L27 46l-3.5 3.5"/><path d="M30 55H17m3.5-3.5L17 55l3.5 3.5"/>
    <path d="M50 43h16v8a8 9 0 0 1-16 0z"/><circle cx="54.5" cy="47" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="61.5" cy="47" r="1.2" fill="currentColor" stroke="none"/><path d="M54 53c2 2 6 2 8 0" stroke-width="1"/></g>`,

  /* 人生の短さについて Day2 図解「二つの蔵（金庫と時間の蔵）」— 左は施錠、右は扉すら無く中身が流れ出す */
  "06-de-brevitate": `<g ${S}><path d="M10 25l12-9 12 9"/><rect x="12" y="25" width="20" height="33"/>
    <rect x="17" y="40" width="10" height="18"/><rect x="19.8" y="46" width="4.6" height="4.5" rx="1"/>
    <path d="M20.9 46v-1.7a1.3 1.3 0 0 1 2.5 0V46" stroke-width="1"/>
    <path d="M46 25l12-9 12 9"/><rect x="48" y="25" width="20" height="33"/>
    <path d="M53 58V46a5 5 0 0 1 10 0v12"/>
    <path d="M64 55c4 .5 8-.5 12-3" stroke-dasharray="2.6 2.4" stroke-width="1"/>
    <g fill="currentColor" stroke="none" opacity=".78"><circle cx="68" cy="55" r="1.5"/><circle cx="73" cy="53.5" r="1.5"/><circle cx="77" cy="51" r="1.5"/></g>
    <line x1="4" y1="58" x2="78" y2="58" stroke-width="1.6"/></g>`,

  /* 道徳感情論 Day2 図解「胸の内の法廷」— 一段高い席の公平な観察者／下に弁護人＝自己愛と被告＝自分 */
  "07-moral-sentiments": `<g ${S}><path d="M40 62C20 47 12 36 12 27a12 12 0 0 1 28-4 12 12 0 0 1 28 4c0 9-8 20-28 35z"/>
    <rect x="31" y="32" width="18" height="6"/><circle cx="40" cy="27" r="3.2"/>
    <circle cx="29" cy="43" r="2.3"/><circle cx="51" cy="43" r="2.3"/>
    <line x1="24" y1="48" x2="34" y2="48" stroke-width="1.1"/><line x1="46" y1="48" x2="56" y2="48" stroke-width="1.1"/></g>`,

  /* マクベス Day1 図解「予言の回路」— 予言→期待→行動→的中が閉じて回る自己実現ループ */
  "09-macbeth": `<g ${S}><circle cx="40" cy="37" r="23"/>
    <g fill="currentColor" stroke="none"><path d="M37 11l5.5 3.2-5.5 3.2z"/><path d="M66.2 34l-3.2 5.5-3.2-5.5z"/>
      <path d="M43 63.2l-5.5-3.2 5.5-3.2z"/><path d="M13.8 40l3.2-5.5 3.2 5.5z"/></g>
    <path d="M29 42l3-11 5 6 3-9 3 9 5-6 3 11z"/><rect x="29" y="42" width="22" height="4.5"/></g>`,

  /* 方法序説 Day3 図解「疑いの解体工事」— 感覚・世界（夢）・数学の床を剥がし、抜けない杭が一本残る */
  "10-discours": `<g ${S}><g opacity=".5" stroke-dasharray="3 2.5"><rect x="18" y="8" width="44" height="6" transform="rotate(-11 40 11)"/></g>
    <g opacity=".8"><rect x="18" y="22" width="44" height="6" transform="rotate(-5 40 25)"/></g>
    <rect x="18" y="36" width="44" height="6"/>
    <path d="M36 46h8v14l-4 4-4-4z"/><line x1="6" y1="64" x2="74" y2="64" stroke-width="1.6"/></g>`,

  /* 科学の論理の例解 Day3 図解「豆袋の三角形」— 袋（規則）とひとつかみ（結果）は実線で手持ち、
     出どころ（事例）へ跳ぶ矢印だけが点線＝アブダクション＝よく外れる跳躍 */
  "11-peirce": `<g ${S}><path d="M34 14h10l3 10a8 8 0 0 1-16 0z"/><path d="M35 14c0-3 8-3 8 0" stroke-width="1"/>
    <g fill="currentColor" stroke="none"><ellipse cx="14" cy="52" rx="2.2" ry="1.6"/><ellipse cx="19" cy="55" rx="2.2" ry="1.6"/><ellipse cx="13" cy="57.5" rx="2.2" ry="1.6"/></g>
    <circle cx="64" cy="53" r="8" stroke-dasharray="3 2.5"/>
    <path d="M61 50.5c0-4 6-4 6 0 0 2.6-3 2.4-3 4.4" stroke-width="1.2"/><circle cx="64" cy="58" r="1" fill="currentColor" stroke="none"/>
    <line x1="33" y1="30" x2="21" y2="47"/>
    <g stroke-dasharray="3 2.5"><path d="M46 28l9 17"/><path d="M23 55h29"/></g>
    <g fill="currentColor" stroke="none"><path d="M56.5 47.5l-3.4-4.4 5.3 1z"/><path d="M55.5 55l-5-2.2v4.4z"/></g></g>`,

  /* 星界の報告 Day1 図解「同じ空、違う数」— 裸眼では六つ、筒ごしでは四十二。見える数は道具が決める。
     左＝裸眼の疎らな星、右＝筒ごしの密な星、間に筒 */
  "12-sidereus": `<g ${S}><rect x="16" y="40" width="30" height="8" rx="2" transform="rotate(-38 31 44)"/>
    <g fill="currentColor" stroke="none"><circle cx="11" cy="55" r="1.4"/><circle cx="18" cy="61" r="1.4"/><circle cx="7" cy="62" r="1.4"/></g>
    <g fill="currentColor" stroke="none" opacity=".85"><circle cx="52" cy="13" r="1.2"/><circle cx="58" cy="11" r="1.2"/><circle cx="64" cy="14" r="1.2"/><circle cx="55" cy="19" r="1.2"/><circle cx="61" cy="21" r="1.2"/><circle cx="67" cy="19" r="1.2"/><circle cx="59" cy="27" r="1.2"/><circle cx="65" cy="28" r="1.2"/><circle cx="72" cy="24" r="1.2"/></g></g>`,

  /* 国富論 Day1 図解「一本の針が十八に割れる」— 左＝一人一本、右＝工程分割で多数。分業＝工程の切り方 */
  "13-wealth-of-nations": `<g ${S}><circle cx="13" cy="24" r="3.4"/><line x1="13" y1="27.4" x2="13" y2="47"/>
    <path d="M20 35h12m-3-3l3 3-3 3"/>
    <g stroke-width="1.2"><circle cx="42" cy="16" r="1.8"/><line x1="42" y1="17.8" x2="42" y2="27"/>
      <circle cx="49" cy="16" r="1.8"/><line x1="49" y1="17.8" x2="49" y2="27"/><circle cx="56" cy="16" r="1.8"/><line x1="56" y1="17.8" x2="56" y2="27"/>
      <circle cx="63" cy="16" r="1.8"/><line x1="63" y1="17.8" x2="63" y2="27"/><circle cx="70" cy="16" r="1.8"/><line x1="70" y1="17.8" x2="70" y2="27"/>
      <circle cx="45.5" cy="36" r="1.8"/><line x1="45.5" y1="37.8" x2="45.5" y2="47"/><circle cx="52.5" cy="36" r="1.8"/><line x1="52.5" y1="37.8" x2="52.5" y2="47"/>
      <circle cx="59.5" cy="36" r="1.8"/><line x1="59.5" y1="37.8" x2="59.5" y2="47"/><circle cx="66.5" cy="36" r="1.8"/><line x1="66.5" y1="37.8" x2="66.5" y2="47"/></g></g>`,

  /* ソクラテスの弁明 Day1 図解「二つの箱」— 中身は同じ、違うのはラベル。左＝封じた箱（知っていると思う）、
     右＝開いた箱＋問い（知らないと知る） */
  "14-apology": `<g ${S}><rect x="8" y="30" width="26" height="24" rx="2"/><line x1="8" y1="30" x2="34" y2="30" stroke-width="2.4"/>
    <circle cx="21" cy="44" r="3"/>
    <rect x="47" y="30" width="26" height="24" rx="2"/><path d="M47 30l7-8h25"/><circle cx="58" cy="45" r="3"/>
    <path d="M62 20c0-3.2 6-3.2 6 0 0 2.6-3 2.4-3 4.4" stroke-width="1.2"/><circle cx="65" cy="28" r="1" fill="currentColor" stroke="none"/></g>`,

  /* 人間知性研究 Day2 図解「輪になった橋」— 橋板「未来は過去に似る」の柱をたどると出発点の岸へ戻る循環 */
  "15-hume": `<g ${S}><circle cx="40" cy="40" r="23"/>
    <line x1="16" y1="27" x2="64" y2="27"/><g stroke-width="1.2"><line x1="26" y1="27" x2="26" y2="33"/><line x1="40" y1="27" x2="40" y2="18"/><line x1="54" y1="27" x2="54" y2="33"/></g>
    <g fill="currentColor" stroke="none"><path d="M64 27l-4 2v-4z"/></g></g>`,

  /* 戦史 Day3 図解「三段の階段（恐怖→名誉→利益）」— 恐怖で始まり名誉で降りられなくなる */
  "16-thucydides": `<g ${S}><path d="M12 22h18v12h18v12h18v12h4"/>
    <g fill="currentColor" stroke="none" opacity=".85"><circle cx="21" cy="18" r="1.6"/><circle cx="39" cy="30" r="1.6"/><circle cx="57" cy="42" r="1.6"/></g></g>`,

  /* 変身 Day1 図解「値段の計器」— 虫になった時ではなく稼げなくなった時に針が落ちる */
  "17-metamorphosis": `<g ${S}><path d="M14 46a26 26 0 0 1 52 0"/><line x1="14" y1="46" x2="66" y2="46"/>
    <g stroke-width="1"><line x1="17" y1="40" x2="20.5" y2="38"/><line x1="40" y1="20" x2="40" y2="24"/><line x1="63" y1="40" x2="59.5" y2="38"/></g>
    <line x1="40" y1="46" x2="21" y2="37"/><circle cx="40" cy="46" r="2.6" fill="currentColor" stroke="none"/></g>`,

  /* 純粋理性批判 Day4 図解「外せない眼鏡」— 認識は必ず感性と悟性のレンズを通る。外して見比べられない */
  "18-kant": `<g ${S}><circle cx="26" cy="38" r="12"/><circle cx="54" cy="38" r="12"/>
    <path d="M38 36q2-3.5 4 0"/><path d="M14.5 34l-8-4"/><path d="M65.5 34l8-4"/></g>`,

  /* 自由論 Day1 図解「危害原理の関所」— 通す唯一の問いは「他人に危害が及ぶか」 */
  "19-on-liberty": `<g ${S}><line x1="20" y1="20" x2="20" y2="54"/><line x1="60" y1="20" x2="60" y2="54"/><path d="M20 26h40"/>
    <line x1="20" y1="35" x2="52" y2="29"/>
    <line x1="12" y1="56" x2="68" y2="56" stroke-width="1.6"/>
    <path d="M37 12c0-3.2 6-3.2 6 0 0 2.6-3 2.4-3 4.4" stroke-width="1.2"/><circle cx="40" cy="20" r="1" fill="currentColor" stroke="none"/></g>`,

  /* 自殺論 Day4 図解「目盛りの消えた物差し」— 物差しは縮んでいない、目盛り（規制）が消えた＝アノミー */
  "20-suicide": `<g ${S}><rect x="8" y="30" width="64" height="12" rx="1.5"/>
    <g stroke-width="1"><line x1="16" y1="30" x2="16" y2="38"/><line x1="24" y1="30" x2="24" y2="35"/><line x1="32" y1="30" x2="32" y2="38"/><line x1="40" y1="30" x2="40" y2="35"/></g>
    <g stroke-width="1" stroke-dasharray="1.4 3" opacity=".4"><line x1="48" y1="30" x2="48" y2="36"/><line x1="56" y1="30" x2="56" y2="36"/><line x1="64" y1="30" x2="64" y2="36"/></g></g>`,

  /* 科学と仮説 Day3 図解「同じ棒を、二つの物差しで」— 幾何は真偽ではなく便利さで選ぶ規約 */
  "21-poincare": `<g ${S}><rect x="14" y="30" width="52" height="8" rx="1.5"/>
    <line x1="14" y1="20" x2="66" y2="20"/><g stroke-width="1"><line x1="20" y1="20" x2="20" y2="15"/><line x1="30" y1="20" x2="30" y2="15"/><line x1="40" y1="20" x2="40" y2="15"/><line x1="50" y1="20" x2="50" y2="15"/><line x1="60" y1="20" x2="60" y2="15"/></g>
    <line x1="14" y1="48" x2="66" y2="48"/><g stroke-width="1"><line x1="22" y1="48" x2="22" y2="54"/><line x1="44" y1="48" x2="44" y2="54"/><line x1="66" y1="48" x2="66" y2="54"/></g></g>`,
};

// cap = 紋章が何を描いているかの一言（票の面に出す）
// frame = 出典話のフレーム（票を開いたときに出す。index.json の frameName と一致）
// src = 紋章の出どころ。捏造を防ぐ追跡子
export const PLATE = {
  "01-kunshuron": { cap: "狐の狡知と、獅子の威", frame: "狐とライオン",
    src: "Day 5 の図解「狐とライオン」より" },
  "02-sonshi": { cap: "四段を下るほど高くつく。最上策は階段の外", frame: "戦わずして人の兵を屈する",
    src: "Day 2 の図解「攻めの四段（コストの階段）」より" },
  "03-uexkull": { cap: "マダニを包むシャボン玉＝環世界", frame: "環世界——生き物の数だけ、世界がある",
    src: "Day 1 の図解「環世界＝シャボン玉」より" },
  "04-ivan-ilyich": { cap: "登りきった梯子が、間違った壁に", frame: "最も単純で最も平凡で、それゆえ最も恐ろしい人生",
    src: "Day 1 の図解「間違った壁の梯子」より" },
  "05-novum-organum": { cap: "種族・洞窟・市場・劇場——四つの偶像", frame: "4つの偶像",
    src: "Day 2 の図解「4つの偶像」より" },
  "06-de-brevitate": { cap: "金庫は施錠、時間の蔵は扉すら無い", frame: "時間の帳簿——金は守るのに、時間は配って歩く",
    src: "Day 2 の図解「二つの蔵（金庫と時間の蔵）」より" },
  "07-moral-sentiments": { cap: "胸の内に、一段高い席の裁判官を", frame: "公平な観察者",
    src: "Day 2 の図解「胸の内の法廷」より" },
  "09-macbeth": { cap: "予言→期待→行動→的中の、閉じた回路", frame: "予言は「当たる」のではない、「動かす」のだ",
    src: "Day 1 の図解「予言の回路」より" },
  "10-discours": { cap: "床を剥がし切って、残るのは一本の杭", frame: "方法的懐疑——全部疑って、残る一点から建て直す",
    src: "Day 3 の図解「疑いの解体工事」より" },
  "11-peirce": { cap: "袋と、ひとつかみ。出どころへは点線で跳ぶ", frame: "アブダクション——驚きから、最良の説明への跳躍",
    src: "Day 3 の図解「豆袋の三角形」より" },
  "12-sidereus": { cap: "裸眼で六つ、筒で四十二——見える数は道具が決める", frame: "見える範囲は、道具が決める",
    src: "Day 1 の図解「同じ空、違う数」より" },
  "13-wealth-of-nations": { cap: "一本の針が、十八の工程に割れる", frame: "分業——富を生むのは、腕ではなく「工程の切り方」",
    src: "Day 1 の図解「一本の針が十八に割れる」より" },
  "14-apology": { cap: "中身は同じ、違うのはラベル——知らないと、知る", frame: "無知の知——「知らない」と知っている者だけが、探し始められる",
    src: "Day 1 の図解「二つの箱」より" },
  "15-hume": { cap: "橋板の柱をたどると、出発点の岸へ戻る", frame: "帰納の問題",
    src: "Day 2 の図解「輪になった橋」より" },
  "16-thucydides": { cap: "恐怖で始まり、名誉で降りられなくなる", frame: "恐怖・名誉・利益",
    src: "Day 3 の図解「三段の階段（恐怖→名誉→利益）」より" },
  "17-metamorphosis": { cap: "虫になった時ではなく、稼げなくなった時、針が落ちる", frame: "役割が、人間の値段を決めている",
    src: "Day 1 の図解「値段の計器」より" },
  "18-kant": { cap: "認識は必ずレンズを通る。外して見比べられない", frame: "外せない眼鏡",
    src: "Day 4 の図解「外せない眼鏡」より" },
  "19-on-liberty": { cap: "通す唯一の問い——他人に危害が及ぶか", frame: "危害原理",
    src: "Day 1 の図解「危害原理の関所」より" },
  "20-suicide": { cap: "物差しは縮んでいない。目盛りが、消えた", frame: "アノミー",
    src: "Day 4 の図解「目盛りの消えた物差し」より" },
  "21-poincare": { cap: "同じ棒を、二つの物差しで。問いは「真か」でなく「便利か」", frame: "規約主義",
    src: "Day 3 の図解「同じ棒を、二つの物差しで」より" },
};

export function hasPlate(slug) { return !!EMBLEM[slug] && !!PLATE[slug]; }
