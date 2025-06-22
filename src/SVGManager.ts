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
		console.log(`🔧 SVGManager.createSvgElement: ${componentType}, scale=${scale}`);

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

		console.log(`📏 Scale calculation: baseScale=${scale}, finalScale=${adjustedScale}`);

		// 有効な子要素を取得してクローン
		this.cloneValidChildren(svgElement, svgGroup);

		// スケールを適用
		svgGroup.setAttribute('transform', `scale(${adjustedScale})`);
		console.log(`🎯 Applied transform: scale(${adjustedScale})`);

		return svgGroup;
	}/**
	 * プレビュー用の要素を作成（実配置と同じスケール使用）
	 */	createPreviewElement(componentType: ComponentType, svgText: string, scale: number = 1.0): SVGGElement {
		console.log(`🎭 Creating preview element for ${componentType} with scale=${scale}`);

		// プレビューはキャッシュを使わず、常に実配置と同じ計算を行う
		const element = this.createSvgElement(componentType, svgText, scale);
		element.classList.add('component-preview');
		console.log(`✨ Created new preview element for ${componentType} with calculated scale`);

		return element;
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
	 * SVGの適切なスケールを計算（グリッドサイズ30pxに基づく統一的な計算）
	 */
	private calculateScale(svgElement: SVGSVGElement, baseScale: number): number {
		const viewBox = svgElement.getAttribute('viewBox');
		console.log(`📐 calculateScale: viewBox="${viewBox}", baseScale=${baseScale}`);

		if (!viewBox) {
			console.log(`⚠️ No viewBox found, returning baseScale=${baseScale}`);
			return baseScale;
		}

		const [, , width, height] = viewBox.split(' ').map(Number);
		const gridSize = 30; // グリッドサイズ

		// コンポーネントタイプ別の目標サイズ（グリッド単位）
		let targetWidth, targetHeight;

		if (height < 80) {
			// インダクタ（高さが小さい）：幅4グリッド（120px）、高さ1.5グリッド（45px）
			targetWidth = gridSize * 4;  // 120px
			targetHeight = gridSize * 1.5; // 45px
		} else {
			// 抵抗器・コンデンサ：幅4グリッド（120px）、高さ2グリッド（60px）
			targetWidth = gridSize * 4;  // 120px
			targetHeight = gridSize * 2; // 60px
		}

		const scaleX = targetWidth / width;
		const scaleY = targetHeight / height;

		// アスペクト比を保持して、どちらか小さい方を採用
		const calculatedScale = Math.min(scaleX, scaleY);

		console.log(`📊 Scale details: width=${width}, height=${height}`);
		console.log(`📊 Target: width=${targetWidth}, height=${targetHeight}`);
		console.log(`📊 Calculated scales: scaleX=${scaleX}, scaleY=${scaleY}, final=${calculatedScale}`);

		return calculatedScale;
	}	/**
	 * MOSトランジスタ用のスケール計算（グリッドサイズ30pxに基づく）
	 */
	private calculateMosScale(svgElement: SVGSVGElement, baseScale: number): number {
		const viewBox = svgElement.getAttribute('viewBox');
		console.log(`🔌 calculateMosScale: viewBox="${viewBox}", baseScale=${baseScale}`);

		if (!viewBox) {
			console.log(`⚠️ No viewBox found, returning baseScale=${baseScale}`);
			return baseScale;
		}

		const [, , width, height] = viewBox.split(' ').map(Number);
		const gridSize = 30; // グリッドサイズ

		// MOSトランジスタ：高さ4グリッド（120px）を優先して計算
		// SVGの元比率140mm:200mm（幅:高さ = 0.7:1）を考慮
		const targetHeight = gridSize * 4; // 120px（4グリッド）

		// 高さを基準にスケールを計算
		const calculatedScale = targetHeight / height;

		// 計算された幅を確認（参考値）
		const resultingWidth = width * calculatedScale;

		console.log(`🔌 MOS Scale details: width=${width}, height=${height}`);
		console.log(`🔌 Target height: ${targetHeight}px (4 grids)`);
		console.log(`🔌 Calculated scale: ${calculatedScale}`);
		console.log(`🔌 Resulting width: ${resultingWidth}px (${(resultingWidth / gridSize).toFixed(1)} grids)`);

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
