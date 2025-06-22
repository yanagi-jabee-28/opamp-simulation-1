import { ComponentType, ComponentDefinition } from './types.js';

/**
 * SVGの読み込み、キャッシュ、プレビュー生成を管理するクラス
 */
export class SVGManager {
	private svgCache: Map<ComponentType, string> = new Map();
	private elementCache: Map<string, SVGGElement> = new Map(); // 解析済み要素のキャッシュ
	private previewCache: Map<ComponentType, SVGGElement> = new Map(); // プレビュー要素のキャッシュ

	/**
	 * SVGコンテンツを読み込む（キャッシュ使用）
	 */
	async loadSvgContent(componentType: ComponentType, definition: ComponentDefinition): Promise<string | null> {
		// キャッシュから取得
		if (this.svgCache.has(componentType)) {
			return this.svgCache.get(componentType) || null;
		}

		try {
			const response = await fetch(definition.svgPath);
			const svgText = await response.text();
			// キャッシュに保存
			this.svgCache.set(componentType, svgText);
			return svgText;
		} catch (error) {
			console.error(`Failed to load SVG for ${componentType}:`, error);
			return null;
		}
	}	/**
	 * SVGテキストから使用可能な要素を作成（キャッシュ使用）
	 */	createSvgElement(componentType: ComponentType, svgText: string, scale: number = 1.0): SVGGElement {
		// キャッシュは使わず、常に新しい要素を作成して正確なスケール計算を行う
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
		const svgElement = svgDoc.documentElement as unknown as SVGSVGElement;

		// SVGグループを作成
		const svgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

		// コンポーネントタイプ別のスケール調整（baseScaleは無視して、グリッドベースで計算）
		let adjustedScale;
		if (componentType === 'nmos' || componentType === 'pmos') {
			adjustedScale = this.calculateMosScale(svgElement, scale);
		} else {
			// viewBoxからスケールを計算
			adjustedScale = this.calculateScale(svgElement, scale);
		}

		// 有効な子要素を取得してクローン
		this.cloneValidChildren(svgElement, svgGroup);

		// 端子の中心をグリッドに合わせるためのオフセット計算
		let offsetX = 0, offsetY = 0;

		// 既に取得済みのviewBoxから高さを取得
		const viewBox = svgElement.getAttribute('viewBox');
		if (viewBox) {
			const [, , , height] = viewBox.split(' ').map(Number);

			if (componentType === 'inductor') {
				// インダクタ：元の高さの半分だけ下にオフセット（スケール前）
				offsetY = height / 2;
			} else if (componentType === 'nmos' || componentType === 'pmos') {
				// MOSトランジスタ：元の高さの半分だけ下にオフセット（スケール前）
				offsetY = height / 2;
			}
		}
		// スケールとオフセットを適用（translate を先に適用してからscale）
		const transform = offsetX !== 0 || offsetY !== 0
			? `translate(${offsetX * adjustedScale}, ${offsetY * adjustedScale}) scale(${adjustedScale})`
			: `scale(${adjustedScale})`;

		svgGroup.setAttribute('transform', transform);

		// 位置関連のデバッグのみ
		console.log(`🎯 Position Debug - Component: ${componentType}, Transform: ${transform}, Scale: ${adjustedScale}, OffsetY: ${offsetY}`);

		return svgGroup;
	}	/**
	 * プレビュー用の要素を作成（シンプルな表示）
	 */
	createPreviewElement(componentType: ComponentType, svgText: string, scale: number = 0.4): SVGGElement {
		// プレビュー用のグループ要素を作成
		const svgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		svgGroup.classList.add('component-preview');

		// SVGコンテンツをパース
		const parser = new DOMParser();
		const doc = parser.parseFromString(svgText, 'image/svg+xml');
		const svgElement = doc.documentElement;

		// すべての子要素を追加（シンプルにコピーのみ）
		while (svgElement.firstChild) {
			const child = document.importNode(svgElement.firstChild, true);
			svgGroup.appendChild(child);
		}

		// プレビューには統一スケールのみ適用（位置オフセットなし）
		svgGroup.setAttribute('transform', `scale(${scale})`);

		// プレビュー作成時のデバッグ
		console.log(`🎭 Preview Created - Component: ${componentType}, Scale: ${scale}`);

		return svgGroup;
	}

	/**
	 * フォールバック用の矩形要素を作成
	 */
	createFallbackElement(componentName: string): SVGGElement {
		const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

		const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rect.setAttribute('width', '60');
		rect.setAttribute('height', '30');
		rect.setAttribute('fill', '#ddd');
		rect.setAttribute('stroke', '#999');
		rect.setAttribute('stroke-width', '2');

		const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		text.setAttribute('x', '30');
		text.setAttribute('y', '20');
		text.setAttribute('text-anchor', 'middle');
		text.setAttribute('font-size', '12');
		text.setAttribute('fill', '#666');
		text.textContent = componentName;

		group.appendChild(rect);
		group.appendChild(text);

		return group;
	}	/**
	 * SVGの適切なスケールを計算（グリッドサイズ20pxに基づく統一的な計算）
	 */	private calculateScale(svgElement: SVGSVGElement, baseScale: number): number {
		const viewBox = svgElement.getAttribute('viewBox');

		if (!viewBox) {
			return baseScale;
		}
		const [, , width, height] = viewBox.split(' ').map(Number);
		const gridSize = 20; // グリッドサイズ

		// MOSトランジスタの端子位置に合わせた目標サイズ（グリッド単位）
		// MOSトランジスタ端子間隔を基準とする
		let targetWidth, targetHeight;

		if (height <= 60) {
			// インダクタ（200mm × 50mm）：端子位置をMOSに合わせる
			// 幅4グリッド（80px）、高さ1グリッド（20px）
			targetWidth = gridSize * 4;  // 80px
			targetHeight = gridSize * 1; // 20px
		} else if (height <= 120) {
			// 抵抗器・コンデンサ（200mm × 100mm）：端子位置をMOSに合わせる
			// 幅4グリッド（80px）、高さ2グリッド（40px）
			targetWidth = gridSize * 4;  // 80px
			targetHeight = gridSize * 2; // 40px
		} else {
			// その他の大きなコンポーネント：幅4グリッド（80px）、高さ6グリッド（120px）
			targetWidth = gridSize * 4;  // 80px
			targetHeight = gridSize * 6; // 120px
		}

		const scaleX = targetWidth / width;
		const scaleY = targetHeight / height;

		// アスペクト比を保持して、どちらか小さい方を採用
		const calculatedScale = Math.min(scaleX, scaleY);

		return calculatedScale;
	}/**
	 * MOSトランジスタ用のスケール計算（グリッドサイズ20pxに基づく）
	 */	private calculateMosScale(svgElement: SVGSVGElement, baseScale: number): number {
		const viewBox = svgElement.getAttribute('viewBox');

		if (!viewBox) {
			return baseScale;
		}
		const [, , , height] = viewBox.split(' ').map(Number);
		const gridSize = 20; // グリッドサイズ

		// MOSトランジスタ：高さ4グリッド（80px）に制限
		const targetHeight = gridSize * 4; // 80px（4グリッド）

		// 高さを基準にスケールを計算（4グリッドに制限）
		const calculatedScale = targetHeight / height;

		return calculatedScale;
	}

	/**
	 * 有効な子要素をクローンして追加
	 */
	private cloneValidChildren(svgElement: SVGSVGElement, targetGroup: SVGGElement): void {
		// metadata, defs, namedviewなどの非表示要素を除く
		const validChildren = Array.from(svgElement.children).filter(child => {
			const tagName = child.tagName.toLowerCase();
			return tagName !== 'metadata' && tagName !== 'defs' &&
				tagName !== 'namedview' && tagName !== 'sodipodi:namedview' &&
				tagName !== 'title' && tagName !== 'desc';
		});

		if (validChildren.length > 0) {
			validChildren.forEach((child) => {
				const clonedElement = child.cloneNode(true) as SVGElement;
				targetGroup.appendChild(clonedElement);
			});
		} else {			// フォールバック: 表示可能な要素を直接検索
			const visibleElements = svgElement.querySelectorAll('path, rect, circle, line, polyline, polygon, ellipse, g');
			visibleElements.forEach((element) => {
				if (element.parentElement && (element.parentElement as any) === svgElement) {
					const clonedElement = element.cloneNode(true) as SVGElement;
					targetGroup.appendChild(clonedElement);
				}
			});
		}
	}

	/**
	 * キャッシュをクリア
	 */
	clearCache(): void {
		this.svgCache.clear();
		this.elementCache.clear();
		this.previewCache.clear();
	}

	/**
	 * キャッシュサイズを取得（デバッグ用）
	 */
	getCacheInfo(): { svg: number; element: number; preview: number } {
		return {
			svg: this.svgCache.size,
			element: this.elementCache.size,
			preview: this.previewCache.size
		};
	}
}
