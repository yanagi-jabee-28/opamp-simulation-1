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
	}

	/**
	 * SVGテキストから使用可能な要素を作成（キャッシュ使用）
	 */
	createSvgElement(componentType: ComponentType, svgText: string, scale: number = 0.4): SVGGElement {
		const cacheKey = `${componentType}_${scale}`;

		// キャッシュから取得
		if (this.elementCache.has(cacheKey)) {
			const cached = this.elementCache.get(cacheKey)!;
			return cached.cloneNode(true) as SVGGElement;
		}
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
		const svgElement = svgDoc.documentElement as unknown as SVGSVGElement;

		// SVGグループを作成
		const svgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

		// viewBoxからスケールを計算
		const finalScale = this.calculateScale(svgElement, scale);

		// 有効な子要素を取得してクローン
		this.cloneValidChildren(svgElement, svgGroup);

		// スケールを適用
		svgGroup.setAttribute('transform', `scale(${finalScale})`);

		// キャッシュに保存
		this.elementCache.set(cacheKey, svgGroup.cloneNode(true) as SVGGElement);

		return svgGroup;
	}	/**
	 * プレビュー用の要素を作成（軽量版）
	 */
	createPreviewElement(componentType: ComponentType, svgText: string): SVGGElement {
		// プレビュー専用キャッシュから取得
		if (this.previewCache.has(componentType)) {
			const cached = this.previewCache.get(componentType)!;
			const cloned = cached.cloneNode(true) as SVGGElement;
			cloned.classList.add('component-preview');
			return cloned;
		}

		// プレビュー用の専用要素を作成（実際のコンポーネントと同じスケール）
		const element = this.createSvgElement(componentType, svgText, 1.0);
		element.classList.add('component-preview');

		// プレビューキャッシュに保存
		this.previewCache.set(componentType, element.cloneNode(true) as SVGGElement);

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
	}
	/**
	 * SVGの適切なスケールを計算
	 */
	private calculateScale(svgElement: SVGSVGElement, baseScale: number): number {
		const viewBox = svgElement.getAttribute('viewBox');
		if (!viewBox) return baseScale;

		const [, , width, height] = viewBox.split(' ').map(Number);
		const targetSize = 80;
		const scaleX = targetSize / width;
		const scaleY = targetSize / height;
		return Math.min(scaleX, scaleY, baseScale);
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
