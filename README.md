# 電子回路部品ライブラリ

TypeScript + React + Tailwind CSSで構築された、再利用可能な電子回路部品ライブラリです。電子回路の基本素子（抵抗器、インダクタ、コンデンサ、MOSFET）をSVGで描画し、美しいUIで部品の保存・読み込み・エクスポート/インポート機能を提供します。

## ✨ 特徴

### 🔧 対応部品
- ✅ **抵抗器 (Resistor)**: 高品質SVGファイルベースの抵抗器シンボル
- ✅ **インダクタ (Inductor)**: 専用設計のコイル形状インダクタ
- ✅ **コンデンサ (Capacitor)**: プロ仕様の平行板コンデンサシンボル
- ✅ **NMOS**: 極めてシンプルな標準NMOS回路記号
- ✅ **PMOS**: バブル付きの標準PMOS回路記号

### 🎨 機能
- ✅ **SVGベース描画**: `svg-components/`フォルダの高品質SVGファイルを使用
- ✅ **フォールバック機能**: SVG読み込み失敗時の自動フォールバック
- ✅ **インタラクティブな配置**: ドラッグ&ドロップで部品を配置
- ✅ **部品ライブラリ**: 作成した回路の保存・読み込み
- ✅ **エクスポート/インポート**: JSON形式でのデータ交換
- ✅ **使用例ページ**: 各部品の詳細な例とデモ
- ✅ **レスポンシブデザイン**: モバイル対応の美しいUI
- ✅ **型安全性**: TypeScriptによる完全な型サポート

### 🔥 新機能 (SVGベース)
- 📁 **外部SVGファイル**: `svg-components/`フォルダの「素子2」SVGファイルを使用
- 🎯 **プロ品質**: 設計された高品質回路シンボル
- 🔧 **メンテナンス性**: SVGファイル更新でシンボル変更可能
- ⚡ **パフォーマンス**: 効率的な画像読み込みとエラーハンドリング

## 🚀 セットアップと実行

### 前提条件
- Node.js 18.x以上
- npm または yarn

### 依存関係のインストール
```bash
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```

ブラウザで http://localhost:5173/ にアクセスして電子回路部品ライブラリを使用できます。

### ビルド
```bash
npm run build
```

### プレビュー
```bash
npm run preview
```

## 📦 使用技術

- **React 18**: モダンなUI構築フレームワーク
- **TypeScript 5**: 型安全なJavaScript開発
- **Vite 5**: 高速なビルドツールとHMR
- **Tailwind CSS 3**: ユーティリティファーストCSS
- **React Router**: SPA用ルーティング
- **SVG**: 高品質なベクター図形描画

## ⚙️ 設定ファイル

プロジェクトは以下の設定ファイルで管理されています：

### 📦 プロジェクト管理
- **`package.json`**: プロジェクト定義、依存関係、NPMスクリプト
- **`package-lock.json`**: 依存関係の正確なバージョン固定（自動生成）

### 🔧 ビルド・開発環境
- **`vite.config.ts`**: Viteビルドツール設定（React、HMR、バンドル）
- **`tsconfig.json`**: TypeScriptメイン設定（src/用）
- **`tsconfig.node.json`**: TypeScript Node.js設定（Vite設定用）

### 🎨 スタイル処理
- **`tailwind.config.js`**: Tailwind CSS設定（適用範囲、テーマ）
- **`postcss.config.js`**: PostCSS設定（Tailwind処理、Autoprefixer）

📋 詳細は [`docs/config-files-guide.md`](./docs/config-files-guide.md) を参照してください。

## 📁 プロジェクト構造

```
opamp-simulation-1/
├── src/                          # TypeScript/Reactソースコード
│   ├── components/               # Reactコンポーネント
│   ├── lib/                     # 部品ライブラリのコアロジック
│   └── main.tsx                 # エントリーポイント
├── svg-components/              # SVG部品ファイル（素子2バージョン）
│   ├── resistor2.svg           # 抵抗器SVG
│   ├── inductor2.svg           # インダクタSVG
│   ├── capacitor2.svg          # コンデンサSVG
│   ├── nmos-simple2.svg        # NMOS SVG
│   └── pmos-simple2.svg        # PMOS SVG
├── public/                      # 静的ファイル・テストページ
│   ├── svg-test.html           # SVGコンポーネントテストページ
│   └── index.html              # スタンドアロンデモページ
├── legacy/                      # 旧バージョンファイル
├── docs/                        # ドキュメント・設計ファイル
│   └── test.drawio             # Draw.io設計ファイル
├── new018.md                    # SPICEモデルパラメータ
└── README.md                    # このファイル
```

### 重要なファイル
- **`src/lib/circuit-components.ts`**: 部品ライブラリのコアクラス
- **`src/components/ComponentLibraryApp.tsx`**: メインアプリケーション
- **`svg-components/`**: 高品質なSVG部品ファイル
- **`public/svg-test.html`**: 開発・テスト用ページ

## 💡 機能詳細

### 部品ライブラリ画面
- **部品配置**: 抵抗器、インダクタ、コンデンサをキャンバスに配置
- **部品管理**: 配置された部品の削除と選択
- **保存/読み込み**: 作成した回路をローカルストレージに保存
- **エクスポート/インポート**: JSON形式でのデータ交換

### 使用例ページ
- **個別デモ**: 各部品の詳細な説明と実装例
- **インタラクティブ**: 部品パラメータのリアルタイム変更
- **コード例**: TypeScriptクラスの使用方法

### 電子部品クラス
- **CircuitComponent**: 基底クラス（位置、回転、描画）
- **Resistor**: 抵抗器クラス（ジグザグ形状）
- **Inductor**: インダクタクラス（コイル形状）
- **Capacitor**: コンデンサクラス（平行板）
- **CircuitDiagram**: 回路図管理クラス
- **ComponentLibrary**: 部品保存/読み込みクラス

## 🎯 アーキテクチャ

### 型安全性
- 完全なTypeScript型定義
- インターフェースベースの設計
- 型安全なイベントハンドリング

### 保守性
- モジュール化された部品クラス
- 再利用可能なReactコンポーネント
- 分離された関心事（UI/ロジック）

### 拡張性
- 新しい部品の簡単な追加
- プラグイン可能なアーキテクチャ
- カスタムスタイリング対応

## � 今後の予定

- ⏳ **追加部品**: ダイオード、トランジスタ、オペアンプなど
- ⏳ **配線機能**: 部品間の配線とネットリスト生成
- ⏳ **回路シミュレーション**: SPICE互換のシミュレーション機能
- ⏳ **テーマ**: ダーク/ライトモードとカスタムテーマ
- ⏳ **印刷機能**: 高品質なPDF/SVGエクスポート

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📄 ライセンス

このプロジェクトはMITライセンスのもとで公開されています。詳細は `LICENSE` ファイルを参照してください。

## 📧 お問い合わせ

プロジェクトに関するご質問やフィードバックがありましたら、Issues またはDiscussionsでお気軽にお知らせください。