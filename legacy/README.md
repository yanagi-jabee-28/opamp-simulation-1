# レガシーファイル

このフォルダには、TypeScript + Reactに移行する前の旧バージョンのファイルが含まれています。

## ファイル一覧

### HTMLファイル
- `component-library.html` - 古い部品ライブラリのHTMLバージョン
- `examples.html` - 古い使用例ページのHTMLバージョン

### JavaScriptファイル
- ~~`circuit-components.js`~~ - 削除済み（TypeScriptに完全移行のため不要）

## 移行状況

これらのファイルの機能は全て新しいTypeScript + Reactバージョンに移行済みです：

| 旧ファイル                  | 新ファイル                               | 状況                 |
| --------------------------- | ---------------------------------------- | -------------------- |
| `component-library.html`    | `src/components/ComponentLibraryApp.tsx` | ✅ 完全移行           |
| `examples.html`             | `src/components/ExamplesPage.tsx`        | ✅ 完全移行           |
| ~~`circuit-components.js`~~ | `src/lib/circuit-components.ts`          | ✅ 完全移行・削除済み |

## 注意

これらのレガシーファイルは参考用として保持されていますが、実際のアプリケーションでは使用されていません。新しいTypeScriptバージョンを使用してください。
