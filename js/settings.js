// 設定: 呼び名 / テーマ / 再生速度 / クレジット / バックアップ・リセット。
import { store } from "./store.js";
import { player, RATES } from "./player.js";
import { applyTheme } from "./app.js";
import { esc } from "./ui.js";
import { VOICEVOX_CREDITS } from "../config.js";

export function renderSettings(el, app) {
  const s = store.get().settings;
  const portraitCredits = app.index.series
    .filter(x => x.portraitCredit)
    .map(x => `『${esc(x.title)}』${esc(x.author)}：${esc(x.portraitCredit)}`);

  el.innerHTML = `
    <button class="crumb" id="back">‹ 戻る</button>
    <h1 class="settings-title">設定</h1>

    <section class="set">
      <label class="set-label" for="name">あなたの呼び名</label>
      <input class="set-input" id="name" type="text" value="${esc(s.listenerName)}" maxlength="12" placeholder="あなた">
      <p class="set-help">台本の中の呼びかけに使われます。</p>
    </section>

    <section class="set">
      <span class="set-label">テーマ</span>
      <div class="seg" id="theme">
        ${["auto", "light", "dark"].map(t =>
          `<button data-t="${t}" aria-pressed="${s.theme === t}">${{ auto: "自動", light: "ライト", dark: "ダーク" }[t]}</button>`).join("")}
      </div>
    </section>

    <section class="set">
      <span class="set-label">再生速度（既定）</span>
      <div class="seg wrap" id="rate">
        ${RATES.map(r => `<button data-r="${r}" aria-pressed="${s.playRate === r}">×${r}</button>`).join("")}
      </div>
    </section>

    <section class="set">
      <span class="set-label">毎日の習慣にする（通知）</span>
      <div class="credits">
        <p class="set-help">お使いのカレンダーに「毎日1話」の繰り返し予定を取り込む方式です（アプリからの通知と違いサーバ不要で確実。時刻は取り込み後にカレンダー側で自由に変更できます）。</p>
        <div class="set-row" style="margin-top:8px">
          <a class="btn" href="assets/habit/meicho-daily-2115.ics">毎晩 21:15 の予定を取り込む</a>
          <a class="btn" href="assets/habit/meicho-weekday-0800.ics">平日朝 8:00 の予定を取り込む</a>
        </div>
        <p class="set-help" style="margin-top:8px">iPhone: リンクを開く →「カレンダーに追加」。さらに強力にするなら、ショートカットアプリの「オートメーション」で<b>「イヤホンに接続したとき → このサイトを開く」</b>を設定すると、歩き出してイヤホンを着けるだけで本棚が開きます。</p>
      </div>
    </section>

    <section class="set">
      <span class="set-label">クレジット</span>
      <div class="credits">
        <p><b>音声合成</b>：VOICEVOX</p>
        <ul class="clean">${VOICEVOX_CREDITS.map(c => `<li>VOICEVOX：${esc(c)}</li>`).join("")}</ul>
        ${portraitCredits.length ? `<p style="margin-top:12px"><b>著者肖像（パブリックドメイン）</b></p>
          <ul class="clean">${portraitCredits.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
        <p class="set-help" style="margin-top:12px">引用はすべて番組訳＝パブリックドメイン原典からの本番組独自訳。既存の出版翻訳は不使用。</p>
      </div>
    </section>

    <section class="set">
      <span class="set-label">データ</span>
      <div class="set-row">
        <button class="btn" id="export">バックアップを書き出す</button>
        <button class="btn" id="import">読み込む</button>
        <button class="btn danger" id="reset">進捗をリセット</button>
      </div>
      <p class="set-help">進捗（聴了・続きから・クイズ）はこの端末にのみ保存されます。</p>
      <input type="file" id="importFile" accept="application/json" hidden>
    </section>
  `;

  el.querySelector("#back").addEventListener("click", () => app.goBack());

  el.querySelector("#name").addEventListener("change", e => {
    store.update(st => { st.settings.listenerName = e.target.value.trim() || "あなた"; });
  });

  el.querySelector("#theme").addEventListener("click", e => {
    const b = e.target.closest("[data-t]"); if (!b) return;
    store.update(st => { st.settings.theme = b.dataset.t; });
    applyTheme();
    el.querySelectorAll("#theme button").forEach(x => x.setAttribute("aria-pressed", x === b));
  });

  el.querySelector("#rate").addEventListener("click", e => {
    const b = e.target.closest("[data-r]"); if (!b) return;
    player.setRate(+b.dataset.r);
    el.querySelectorAll("#rate button").forEach(x => x.setAttribute("aria-pressed", x === b));
  });

  el.querySelector("#export").addEventListener("click", () => {
    const blob = new Blob([store.exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sekai-no-meicho-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  const fileInput = el.querySelector("#importFile");
  el.querySelector("#import").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const f = fileInput.files[0]; if (!f) return;
    try {
      store.importJson(await f.text());
      applyTheme();
      app.navigate("settings", {}, { replace: true });
      alert("読み込みました。");
    } catch (err) { alert("読み込めませんでした：" + err.message); }
  });
  el.querySelector("#reset").addEventListener("click", () => {
    if (confirm("進捗をすべて消去します。よろしいですか？")) {
      store.resetAll();
      applyTheme();
      app.navigate("home", {}, { replace: true });
    }
  });
}
