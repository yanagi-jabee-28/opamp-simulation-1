# 電子回路部品ライブラリ

TypeScript + React + Tailwind CSSで構築された、再利用可能な電子回路部品ライブラリです。電子回路の基本素子（抵抗器、インダクタ、コンデンサ）をSVGで描画し、美しいUIで部品の保存・読み込み・エクスポート/インポート機能を提供します。

## ✨ 特徴

### 🔧 対応部品
- ✅ **抵抗器 (Resistor)**: ジグザグ形状の抵抗器
- ✅ **インダクタ (Inductor)**: 巻き線コイル形状のインダクタ
- ✅ **コンデンサ (Capacitor)**: 平行板コンデンサ

### 🎨 機能
- ✅ **インタラクティブな配置**: ドラッグ&ドロップで部品を配置
- ✅ **部品ライブラリ**: 作成した回路の保存・読み込み
- ✅ **エクスポート/インポート**: JSON形式でのデータ交換
- ✅ **使用例ページ**: 各部品の詳細な例とデモ
- ✅ **レスポンシブデザイン**: モバイル対応の美しいUI
- ✅ **型安全性**: TypeScriptによる完全な型サポート

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

## 📁 プロジェクト構造

```
├── src/
│   ├── components/
│   │   ├── ComponentLibraryApp.tsx  # メイン部品ライブラリ画面
│   │   └── ExamplesPage.tsx         # 使用例とデモページ
│   ├── lib/
│   │   └── circuit-components.ts    # 電子回路部品クラス定義
│   ├── App.tsx                      # メインアプリケーション
│   ├── main.tsx                     # エントリーポイント
│   ├── index.css                    # グローバルスタイル
│   └── vite-env.d.ts               # TypeScript型定義
├── index.html                       # HTMLテンプレート
├── package.json                     # プロジェクト設定
├── tailwind.config.js              # Tailwind CSS設定
├── postcss.config.js               # PostCSS設定
├── tsconfig.json                    # TypeScript設定
├── tsconfig.node.json              # Node.js用TypeScript設定
└── vite.config.ts                  # Vite設定
```

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