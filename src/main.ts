import { CircuitCanvas } from './CircuitCanvas.js';

class App {
	private canvas: CircuitCanvas;

	constructor() {
		this.canvas = new CircuitCanvas('canvas');
		this.setupFileImport();
		this.setupKeyboardShortcuts();
	}

	private setupFileImport(): void {
		// ファイルインポート機能の追加
		const importButton = document.createElement('button');
		importButton.textContent = 'インポート';
		importButton.addEventListener('click', () => {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.json';
			input.addEventListener('change', (e) => {
				const target = e.target as HTMLInputElement;
				const file = target.files?.[0];
				if (file) {
					const reader = new FileReader();
					reader.onload = (e) => {
						const content = e.target?.result as string;
						this.canvas.importFromJSON(content);
					};
					reader.readAsText(file);
				}
			});
			input.click();
		});

		const controls = document.querySelector('.controls');
		if (controls) {
			controls.appendChild(importButton);
		}
	}

	private setupKeyboardShortcuts(): void {
		document.addEventListener('keydown', (e) => {
			// Ctrl+S で保存
			if (e.ctrlKey && e.key === 's') {
				e.preventDefault();
				this.canvas.exportToJSON();
			}

			// Delete または Backspace で選択コンポーネント削除
			if (e.key === 'Delete' || e.key === 'Backspace') {
				const selectedComponent = document.querySelector('.placed-component.selected');
				if (selectedComponent) {
					const deleteButton = selectedComponent.parentElement?.querySelector('.delete-button button') as HTMLButtonElement;
					if (deleteButton) {
						deleteButton.click();
					}
				}
			}

			// Escape でコンポーネント選択をクリア
			if (e.key === 'Escape') {
				const selectedItems = document.querySelectorAll('.component-item.selected');
				selectedItems.forEach(item => item.classList.remove('selected'));
				const canvas = document.getElementById('canvas');
				if (canvas) {
					canvas.style.cursor = 'default';
				}
			}
		});
	}
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
	new App();
});

// デバッグ用のグローバル関数
(window as any).debugApp = {
	exportCanvas: () => {
		const canvas = document.getElementById('canvas');
		if (canvas) {
			console.log(canvas.outerHTML);
		}
	}
};
