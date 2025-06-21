# デバッグシステム使用方法

## 概要
このプロジェクトには統一されたデバッグシステムが導入されています。開発時にはデバッグ情報を詳細に出力し、本番時には無効にできます。

## 基本的な使用方法

### ブラウザのコンソールから制御

デバッグシステムはブラウザのデベロッパーツールから簡単に制御できます：

```javascript
// デバッグの有効/無効
circuitDebug.enable()   // デバッグを有効にする
circuitDebug.disable()  // デバッグを無効にする

// デバッグレベルの設定
circuitDebug.setLevel('INFO')    // INFOレベル以上のみ表示
circuitDebug.setLevel('DEBUG')   // DEBUGレベル以上のみ表示
circuitDebug.setLevel('ERROR')   // ERRORレベルのみ表示

// カテゴリの設定（複数指定可能）
circuitDebug.setCategories(['COMPONENT', 'SVG'])  // コンポーネントとSVG関連のみ
circuitDebug.setCategories(['EVENTS'])            // イベント関連のみ

// 現在の設定を確認
circuitDebug.showConfig()

// ヘルプを表示
circuitDebug.help()
```

### デバッグレベル

- **OFF** (0): デバッグ出力なし
- **ERROR** (1): エラーのみ
- **WARN** (2): 警告以上
- **INFO** (3): 情報以上
- **DEBUG** (4): デバッグ情報以上（デフォルト）
- **TRACE** (5): すべて

### デバッグカテゴリ

- **COMPONENT**: コンポーネントの作成・削除・更新
- **CANVAS**: キャンバスの初期化・設定
- **EVENTS**: ユーザーイベント（クリック、ドラッグ等）
- **SVG**: SVGファイルの読み込み・処理
- **POSITIONING**: コンポーネントの位置・回転
- **UI**: UI要素の操作・状態変更

## 開発時の推奨設定

### 全体的なデバッグ
```javascript
circuitDebug.setLevel('DEBUG')
circuitDebug.setCategories(['COMPONENT', 'CANVAS', 'EVENTS', 'SVG', 'POSITIONING', 'UI'])
```

### SVGの問題をデバッグ
```javascript
circuitDebug.setLevel('DEBUG')
circuitDebug.setCategories(['SVG', 'COMPONENT'])
```

### イベント処理の問題をデバッグ
```javascript
circuitDebug.setLevel('DEBUG')
circuitDebug.setCategories(['EVENTS', 'UI'])
```

### 位置決めの問題をデバッグ
```javascript
circuitDebug.setLevel('DEBUG')
circuitDebug.setCategories(['POSITIONING', 'EVENTS'])
```

## 本番環境での無効化

本番環境では以下のいずれかの方法でデバッグを無効にできます：

### 方法1: 設定での無効化
```typescript
// debug.ts の設定を変更
enabled: false, // 開発時はtrue、本番時はfalse
```

### 方法2: レベルでの無効化
```javascript
circuitDebug.setLevel('OFF')
```

## コード内でのデバッグ使用例

### 基本的な使用
```typescript
import { debugComponent, debugSVG, debugEvents } from './debug.js';

// 簡単なデバッグメッセージ
debugComponent('コンポーネントが作成されました');

// データと一緒に出力
debugSVG('SVGファイルを読み込み中:', svgPath);

// オブジェクトの詳細を出力
debugEvents('マウスイベント:', { x: event.clientX, y: event.clientY });
```

### 高度な使用
```typescript
import { debug, DebugCategory } from './debug.js';

// パフォーマンス測定
const result = debug.time(DebugCategory.SVG, 'SVG読み込み', () => {
    return loadSVGFile(path);
});

// 非同期処理の測定
const result = await debug.timeAsync(DebugCategory.COMPONENT, 'コンポーネント作成', async () => {
    return await createComponent(data);
});

// オブジェクトの詳細表示
debug.dump(DebugCategory.COMPONENT, 'コンポーネントデータ', componentData);
```

## トラブルシューティング

### よくある使用例

1. **コンポーネントが正しく配置されない場合**
   ```javascript
   circuitDebug.setCategories(['COMPONENT', 'POSITIONING', 'EVENTS'])
   ```

2. **SVGが正しく表示されない場合**
   ```javascript
   circuitDebug.setCategories(['SVG', 'COMPONENT'])
   ```

3. **クリックイベントが効かない場合**
   ```javascript
   circuitDebug.setCategories(['EVENTS', 'UI'])
   ```

4. **パフォーマンスの問題**
   ```javascript
   circuitDebug.setLevel('INFO')  // より重要な情報のみ
   ```

## 注意事項

- デバッグ出力は開発時のみ使用し、本番環境では無効にしてください
- 大量のデバッグ出力はパフォーマンスに影響する可能性があります
- 機密情報をデバッグ出力に含めないよう注意してください
