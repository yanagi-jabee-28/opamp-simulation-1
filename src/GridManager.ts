import { Point, GridSettings } from './types.js';

/**
 * グリッド関連の機能を管理するクラス
 */
export class GridManager {
	private settings: GridSettings = { size: 20, visible: true };
	private canvas: SVGSVGElement;

	constructor(canvas: SVGSVGElement) {
		this.canvas = canvas;
		this.updateGrid();
		this.setupEventListeners();
	}

	/**
	 * グリッド設定を取得
	 */
	getSettings(): GridSettings {
		return { ...this.settings };
	}

	/**
	 * グリッドサイズを設定
	 */
	setSize(size: number): void {
		this.settings.size = size;
		this.updateGrid();
	}

	/**
	 * グリッド表示/非表示を設定
	 */
	setVisible(visible: boolean): void {
		this.settings.visible = visible;
		this.updateGrid();
	}

	/**
	 * 値をグリッドにスナップ
	 */
	snapToGrid(value: number): number {
		return Math.round(value / this.settings.size) * this.settings.size;
	}

	/**
	 * 座標をグリッドにスナップ
	 */
	snapPointToGrid(point: Point): Point {
		return {
			x: this.snapToGrid(point.x),
			y: this.snapToGrid(point.y)
		};
	}

	/**
	 * マウス座標をSVG座標に変換してグリッドにスナップ
	 */
	getSnappedSvgPosition(e: MouseEvent): Point {
		const rect = this.canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// viewBoxを取得してスケールを計算
		const viewBox = this.canvas.viewBox.baseVal;
		const scaleX = viewBox.width / rect.width;
		const scaleY = viewBox.height / rect.height;

		// SVG座標系に変換
		const svgX = x * scaleX + viewBox.x;
		const svgY = y * scaleY + viewBox.y;

		// グリッドにスナップ
		return {
			x: this.snapToGrid(svgX),
			y: this.snapToGrid(svgY)
		};
	}

	/**
	 * グリッドの描画を更新
	 */
	private updateGrid(): void {
		const gridPattern = this.canvas.querySelector('#grid') as SVGPatternElement;
		if (gridPattern) {
			gridPattern.setAttribute('width', this.settings.size.toString());
			gridPattern.setAttribute('height', this.settings.size.toString());
		}

		const gridBackground = this.canvas.querySelector('.grid-background') as SVGRectElement;
		if (gridBackground) {
			if (this.settings.visible) {
				gridBackground.classList.remove('hidden');
			} else {
				gridBackground.classList.add('hidden');
			}
		}
	}

	/**
	 * UI要素のイベントリスナーを設定
	 */
	private setupEventListeners(): void {
		// グリッドサイズの変更
		const gridSizeSelect = document.getElementById('grid-size') as HTMLSelectElement;
		if (gridSizeSelect) {
			gridSizeSelect.addEventListener('change', () => {
				this.setSize(parseInt(gridSizeSelect.value));
			});
		}

		// グリッド表示の切り替え
		const showGridCheckbox = document.getElementById('show-grid') as HTMLInputElement;
		if (showGridCheckbox) {
			showGridCheckbox.addEventListener('change', () => {
				this.setVisible(showGridCheckbox.checked);
			});
		}
	}

	/**
	 * グリッド情報を取得（デバッグ用）
	 */
	getGridInfo(): { size: number; visible: boolean; bounds: DOMRect } {
		return {
			size: this.settings.size,
			visible: this.settings.visible,
			bounds: this.canvas.getBoundingClientRect()
		};
	}
}
