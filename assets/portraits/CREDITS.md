# 著者肖像のクレジット（パブリックドメイン）

本アプリで使う著者肖像は、すべて Wikimedia Commons のパブリックドメイン素材を1点ずつライセンス確認のうえ採用したもの。トリミング・リサイズのみ行い、内容の改変はしていない。

| ファイル | 著者 | 出典・作者 | ライセンス |
|---|---|---|---|
| `01-kunshuron.jpg` | ニッコロ・マキャベリ | サンティ・ディ・ティート画（〜1600年頃）／[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Portrait_of_Niccol%C3%B2_Machiavelli_by_Santi_di_Tito.jpg) | パブリックドメイン（PD-Art／PD-old-100。作者1603年没） |
| `04-ivan-ilyich.jpg` | レフ・トルストイ | セルゲイ・プロクジン゠ゴルスキー撮影（1908年）／[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:L.N.Tolstoy_Prokudin-Gorsky.jpg) | パブリックドメイン（PD-old／1931年以前公表。撮影者1944年没） |
| `05-novum-organum.jpg` | フランシス・ベーコン | パウル・ファン・ソマー画（〜1617年）／[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Somer_Francis_Bacon.jpg) | パブリックドメイン（PD-Art／PD-old-100。作者1622年没） |

## 自作SVG肖像（実在PD肖像を使わない著者）

- **孫武（『孫子』）**: 同時代の肖像が存在しないため、自作SVG原画で代替（`js/avatars.js` の `SUNWU_SVG`）。
- **ヤーコプ・フォン・ユクスキュル（『生物から見た世界』）**: 現存写真のパブリックドメイン性を1点ずつ確認したところ、撮影者不明・米国PDタグの留保があり100%確定できなかったため、法的リスクゼロ回避の方針に従い自作SVG原画で代替（`js/avatars.js` の `UEXKULL_SVG`。preview/uexkull.html の原画を移植）。
- **シオリ・アラタ**（レギュラーMC・懐疑役）: 架空人物のため常に自作SVG。

> 肖像の追加・差し替え時は、必ず各画像のライセンスを Wikimedia Commons のファイルページで1点ずつ確認し、この表とアプリ設定画面のクレジットを更新すること。
