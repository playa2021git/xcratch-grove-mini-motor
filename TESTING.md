# Xcratch読み込み切り分け手順

既存の `grove-mini-motor.js` は、同じURLと拡張IDを何度も使用したため、Xcratchのキャッシュまたは二重登録の影響を受けている可能性があります。

このテストでは、既存版と重ならない新しいファイル名と拡張IDを使用します。

## 1. 読み込み機能だけを確認

Xcratchをいったん閉じ、新しいタブまたはシークレットウィンドウで開きます。

拡張機能ローダーに次を入力します。

```text
https://playa2021git.github.io/xcratch-grove-mini-motor/load-test-v1.js
```

成功すると、`Grove Motor 読込テスト`カテゴリーと、`拡張の読込状態`ブロックが追加されます。

ブロックの値が次なら、GitHub PagesとXcratchローダーは正常です。

```text
OK: load-test-v1
```

## 2. 独立版モーター拡張を確認

次に、別の新しいXcratchタブで次を読み込みます。

```text
https://playa2021git.github.io/xcratch-grove-mini-motor/grove-mini-motor-v1.1.3.js
```

この版は以下を旧版から分離しています。

- ファイル名
- 拡張ID
- チャンネルメニュー

メニュー項目は複雑な `text/value` オブジェクトを使わず、単純な文字列です。

```text
Ch1
Ch2
```

内部では次のように変換します。

| 表示 | 内部I2Cアドレス |
|---|---|
| Ch1 | `0x65` |
| Ch2 | `0x60` |

## 判定

- 読み込みテストも失敗する：Xcratch側のキャッシュ、PWA、ネットワークまたはローダー環境の問題
- 読み込みテストは成功し、モーター版だけ失敗する：モーター版のブロック定義の問題
- 両方成功する：旧URLまたは旧拡張IDのキャッシュ・二重登録が原因
- モーター版は読み込めるが実行できない：TurboWarp互換 `.js` からAkaDako内部I2Cへアクセスできないため、Xcratch正式 `.mjs` 形式への移行が必要
