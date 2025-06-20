# SVG Component Library

電子回路シミュレーション用のSVG素子ライブラリです。

## 含まれる素子

### 受動素子
- **resistor.svg** - 抵抗器
- **inductor.svg** - インダクタ（コイル）
- **capacitor.svg** - コンデンサ

### 能動素子
- **nmos-simple.svg** - NMOS トランジスタ（シンプル版）
- **pmos-simple.svg** - PMOS トランジスタ（シンプル版）

## 特徴

### デザインの統一性
- 線幅: 2px（端子とメイン構造）
- 色設定:
  - 抵抗器: #e74c3c（赤系）
  - インダクタ: #2ecc71（緑系）
  - コンデンサ: #9b59b6（紫系）
  - MOSFET: #000（黒）

### シンプルMOSFETの特徴
- **極めてシンプルな構造**: 縦線＋水平ゲート＋端子線＋矢印のみ
- **NMOS**: 矢印がソースからドレイン方向
- **PMOS**: ゲートにバブル（反転記号）+ 逆向き矢印
- **標準準拠**: 国際的な回路図記号の最小限バージョン

## 使用方法

### Web ブラウザで表示
```html
<img src="svg-components/resistor.svg" alt="抵抗器" width="180" height="80">
```

### SVGとして直接埋め込み
```html
<object data="svg-components/nmos-simple.svg" type="image/svg+xml"></object>
```

### CSS/JavaScriptでの操作
```css
.component-icon {
    width: 60px;
    height: 60px;
    filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
}
```

## ファイル構造
```
svg-components/
├── README.md              # このファイル
├── resistor.svg           # 抵抗器
├── inductor.svg           # インダクタ
├── capacitor.svg          # コンデンサ
├── nmos-simple.svg        # NMOS（シンプル）
└── pmos-simple.svg        # PMOS（シンプル）
```

## ライセンス
このSVGライブラリは、電子回路シミュレーションプロジェクトの一部として作成されました。
自由に使用・改変していただけます。

## バージョン
- v1.0.0 - 基本素子（R、L、C、NMOS、PMOS）の実装
- v1.1.0 - MOSFETシンボルのシンプル化対応

---
Generated for: opamp-simulation-1 project
Date: 2025年6月20日
