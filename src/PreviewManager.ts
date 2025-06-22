import { ComponentType } from './types.js';
import { SVGManager } from './SVGManager.js';
import { GridManager } from './GridManager.js';
import { ComponentRegistry } from './ComponentRegistry.js';

/**
 * プレビュー機能を管理するクラス
 */
export class PreviewManager {
	private canvas: SVGSVGElement;
	private svgManager: SVGManager;
	private gridManager: GridManager;
	private componentRegistry: ComponentRegistry;
	private previewElement: SVGGElement | null = null;
	private activeComponentType: ComponentType | null = null;
	private isUpdating = false;

	constructor(
		canvas: SVGSVGElement,
		svgManager: SVGManager,
		gridManager: GridManager,
		componentRegistry: ComponentRegistry
	) {
		this.canvas = canvas;
		this.svgManager = svgManager;
		this.gridManager = gridManager;
		this.componentRegistry = componentRegistry;
		this.setupEventListeners();
	}

	/**
	 * アクティブなコンポーネントタイプを設定
	 */
	setActiveComponent(componentType: ComponentType | null): void {
		this.activeComponentType = componentType;
		this.hidePreview();

		// 新しいコンポーネントが選択された場合、SVGを事前にロード
		if (componentType) {
			this.preloadSvgContent(componentType);
		}
	}
	/**
	 * プレビューを同期的に更新（高速）
	 */
	updatePreviewSync(e: MouseEvent): void {
		if (!this.activeComponentType || this.isUpdating) return;

		const point = this.gridManager.getSnappedSvgPosition(e);

		// 既にプレビューが存在する場合は位置のみ更新
		if (this.previewElement) {
			// 既存のスケールを保持しながら位置のみ更新
			const existingTransform = this.previewElement.getAttribute('transform') || '';
			const scaleMatch = existingTransform.match(/scale\([^)]+\)/);
			const scaleTransform = scaleMatch ? scaleMatch[0] : '';
			this.previewElement.setAttribute('transform', `translate(${point.x}, ${point.y}) ${scaleTransform}`);
			return;
		}

		// プレビューが存在しない場合は非同期で作成
		this.updatePreviewAsync(e);
	}
	/**
	 * プレビューを非同期で更新（初回作成時）
	 */
	private async updatePreviewAsync(e: MouseEvent): Promise<void> {
		if (!this.activeComponentType || this.isUpdating) return;

		this.isUpdating = true;

		try {
			const definition = this.componentRegistry.getDefinition(this.activeComponentType);
			if (!definition) return;

			const point = this.gridManager.getSnappedSvgPosition(e);

			// 既存のプレビューを削除
			this.hidePreview();

			// SVGコンテンツを取得
			const svgText = await this.svgManager.loadSvgContent(this.activeComponentType, definition);
			if (!svgText) return; console.log(`🔍 PreviewManager: Creating preview for ${this.activeComponentType}`);			// プレビュー要素を作成（デフォルトスケール0.4を使用）
			this.previewElement = this.svgManager.createPreviewElement(this.activeComponentType, svgText, 0.4);
			console.log(`🎭 Preview scale set to: 0.4`);

			// DOMに追加してからBBoxを取得
			// 既存のスケールを保持しながら位置を設定
			const existingTransform = this.previewElement.getAttribute('transform') || '';
			this.previewElement.setAttribute('transform', `translate(${point.x}, ${point.y}) ${existingTransform}`);
			this.canvas.appendChild(this.previewElement);

			// プレビューサイズ情報をデバッグ出力（DOM追加後）
			const bbox = this.previewElement.getBBox();
			const transform = this.previewElement.getAttribute('transform');
			console.log(`👁️ Preview element - BBox: width=${bbox.width}, height=${bbox.height}`);
			console.log(`🎯 Preview transform: ${transform}`);
			console.log(`📐 Preview element tag: ${this.previewElement.tagName}, class: ${this.previewElement.className}`);			// 子要素の情報も出力
			const childElements = this.previewElement.children;
			console.log(`🔍 Preview child elements count: ${childElements.length}`);
			for (let i = 0; i < childElements.length; i++) {
				const child = childElements[i];
				console.log(`  Child ${i}: ${child.tagName}, transform: ${child.getAttribute('transform')}`);
			}

		} finally {
			this.isUpdating = false;
		}
	}

	/**
	 * プレビューを非表示
	 */
	hidePreview(): void {
		// 既存のプレビューをすべて削除
		const existingPreviews = this.canvas.querySelectorAll('.component-preview');
		existingPreviews.forEach(preview => preview.remove());

		if (this.previewElement) {
			this.previewElement.remove();
			this.previewElement = null;
		}
	}

	/**
	 * SVGコンテンツを事前ロード
	 */
	private async preloadSvgContent(componentType: ComponentType): Promise<void> {
		const definition = this.componentRegistry.getDefinition(componentType);
		if (!definition) return;

		try {
			await this.svgManager.loadSvgContent(componentType, definition);
		} catch (error) {
			console.error(`Failed to preload SVG for ${componentType}:`, error);
		}
	}

	/**
	 * イベントリスナーを設定
	 */
	private setupEventListeners(): void {
		// マウス移動でプレビュー更新
		this.canvas.addEventListener('mousemove', (e) => {
			if (this.activeComponentType) {
				this.updatePreviewSync(e);
			}
		});

		// マウスが離れたらプレビューを非表示
		this.canvas.addEventListener('mouseleave', () => {
			this.hidePreview();
		});

		// プレビュークリアイベント
		document.addEventListener('clearPreview', () => {
			this.setActiveComponent(null);
		});
	}

	/**
	 * 現在のアクティブコンポーネントタイプを取得
	 */
	getActiveComponentType(): ComponentType | null {
		return this.activeComponentType;
	}

	/**
	 * プレビューが表示中かどうか
	 */
	isPreviewVisible(): boolean {
		return this.previewElement !== null;
	}
}
