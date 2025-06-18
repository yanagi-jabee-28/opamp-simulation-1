# TSX環境テストプロジェクト

このプロジェクトは.tsx（TypeScript + React）環境が正常に動作するかをテストするために作成されました。

## 🧪 テスト内容

### 基本機能テスト
- ✅ .tsx ファイルの読み込み
- ✅ TypeScript の型定義
- ✅ React Hooks (useState)
- ✅ JSX の記述
- ✅ インターフェース定義
- ✅ イベントハンドラ
- ✅ CSS-in-JS スタイリング

### 高度な機能テスト
- ✅ TypeScript型定義
- ✅ React Hooks (useState, useEffect, useCallback, useMemo)
- ✅ カスタムフック作成
- ✅ ジェネリック型
- ✅ インターフェースと型エイリアス
- ✅ イベントハンドラの型安全性
- ✅ 条件レンダリング
- ✅ リストレンダリング
- ✅ CSS-in-JS
- ✅ コンポーネント間の型受け渡し
- ✅ 高階コンポーネント (HOC)

## 🚀 セットアップと実行

### 依存関係のインストール
```bash
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```

ブラウザで http://localhost:5173/ にアクセスしてテストアプリケーションを確認できます。

### ビルド
```bash
npm run build
```

## 📦 使用技術

- **React 18**: モダンなUI構築
- **TypeScript 5**: 型安全なJavaScript開発
- **Vite 4**: 高速なビルドツール
- **CSS-in-JS**: インライン関数スタイリング

## 📁 プロジェクト構造

```
├── src/
│   ├── App.tsx              # メインアプリケーションコンポーネント
│   ├── AdvancedTSXTest.tsx  # 高度な機能テストコンポーネント
│   ├── main.tsx             # エントリーポイント
│   └── index.css            # グローバルスタイル
├── index.html               # HTMLテンプレート
├── package.json             # プロジェクト設定
├── tsconfig.json            # TypeScript設定
├── tsconfig.node.json       # Node.js用TypeScript設定
└── vite.config.ts           # Vite設定
```

## 💡 機能

### 基本テスト
- インタラクティブなカウンターボタン
- ダークモード/ライトモード切り替え
- TypeScriptの型安全性確認

### 高度なテスト
- カスタムフックの実装とテスト
- ジェネリック型を使ったデータ管理
- 高階コンポーネント (HOC) の実装
- ユーザー管理システム
- パフォーマンス最適化 (useMemo, useCallback)

## 🎯 このプロジェクトの目的

このプロジェクトは以下の確認を目的としています：

1. **環境確認**: .tsxファイルが正常に処理されるか
2. **TypeScript統合**: 型チェックが正常に動作するか
3. **React統合**: JSXが正常にレンダリングされるか
4. **開発体験**: ホットリロードと型チェックが動作するか
5. **ビルド**: 本番環境向けビルドが正常に完了するか

アプリケーションが正常に表示され、すべての機能が動作すれば、.tsx環境が正しく設定されていることが確認できます。