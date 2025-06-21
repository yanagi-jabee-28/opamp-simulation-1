import { ComponentData, Point, ComponentDefinition } from './types.js';
import { debugComponent, debugSVG, debugPositioning } from './debug.js';

export class CircuitComponent {
	private element: SVGGElement;
	private deleteButton: SVGForeignObjectElement;

	constructor(private data: ComponentData, private definition: ComponentDefinition) {
		debugComponent(`Creating CircuitComponent: ${data.type} ID: ${data.id}`);

		this.element = this.createElement();
		this.deleteButton = this.createDeleteButton();
		this.updatePosition();
		this.setupEventListeners();

		debugComponent(`CircuitComponent created successfully: ${data.id}`);
	}

	private createElement(): SVGGElement {
		const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		group.classList.add('placed-component');
		group.setAttribute('data-component-id', this.data.id);

		// 実際のSVGファイルを読み込み
		this.loadSVGContent(group);

		return group;
	} private async loadSVGContent(group: SVGGElement): Promise<void> {
		try {
			debugSVG(`Loading SVG: ${this.definition.svgPath}`);

			const response = await fetch(this.definition.svgPath);
			const svgText = await response.text();
			const parser = new DOMParser();
			const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
			const svgElement = svgDoc.documentElement;

			// SVGの viewBox を取得してスケールを計算
			const viewBox = svgElement.getAttribute('viewBox');
			let scale = 0.4; // デフォルトスケール
			if (viewBox) {
				const [, , width, height] = viewBox.split(' ').map(Number);
				// 適切なサイズに調整（最大80px程度）
				const targetSize = 80;
				const scaleX = targetSize / width;
				const scaleY = targetSize / height;
				scale = Math.min(scaleX, scaleY, 0.4) * this.data.scale;
			}

			// SVGの内容を取得してグループに追加
			// SVG全体をひとつのグループとして扱う
			const svgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

			// metadata, defs, namedviewなどの非表示要素を除く有効な子要素のみを取得
			const validChildren = Array.from(svgElement.children).filter(child => {
				const tagName = child.tagName.toLowerCase();
				return tagName !== 'metadata' && tagName !== 'defs' &&
					tagName !== 'namedview' && tagName !== 'sodipodi:namedview' &&
					tagName !== 'title' && tagName !== 'desc';
			});

			debugSVG(`Found ${validChildren.length} valid children to clone`);

			// すべての有効な子要素を一つのグループにまとめる
			if (validChildren.length > 0) {
				// 各有効な子要素をクローンして追加
				validChildren.forEach((child, index) => {
					debugSVG(`Cloning child ${index}: ${child.tagName}`);
					const clonedElement = child.cloneNode(true) as SVGElement;
					svgGroup.appendChild(clonedElement);
				});
			} else {
				// フォールバック: 表示可能な要素を直接検索
				const visibleElements = svgElement.querySelectorAll('path, rect, circle, line, polyline, polygon, ellipse, g');
				debugSVG(`Fallback: Found ${visibleElements.length} visible elements`);
				visibleElements.forEach((element, index) => {
					// 親がrootのSVG要素である場合のみ追加（ネストを避ける）
					if (element.parentElement === svgElement) {
						const clonedElement = element.cloneNode(true) as SVGElement;
						debugSVG(`Cloning fallback element ${index}: ${element.tagName}`);
						svgGroup.appendChild(clonedElement);
					}
				});
			}

			// スケールを適用
			svgGroup.setAttribute('transform', `scale(${scale})`);
			group.appendChild(svgGroup);

			// 位置を更新（スケールは既に適用済み）
			this.updatePosition();
			debugSVG('SVG loaded successfully');
		} catch (error) {
			console.error(`SVGの読み込みに失敗しました (${this.definition.svgPath}):`, error);
			// フォールバック: 簡単な矩形を表示
			this.createFallbackComponent(group);
		}
	}
	private createFallbackComponent(group: SVGGElement): void {
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
		text.textContent = this.definition.name;

		group.appendChild(rect);
		group.appendChild(text);
	}

	private createDeleteButton(): SVGForeignObjectElement {
		const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
		foreignObject.setAttribute('width', '20');
		foreignObject.setAttribute('height', '20');
		foreignObject.classList.add('delete-button');

		const button = document.createElement('button');
		button.textContent = '×';
		button.className = 'delete-button';
		button.addEventListener('click', (e) => {
			e.stopPropagation();
			this.remove();
		});

		foreignObject.appendChild(button);
		return foreignObject;
	}

	private setupEventListeners(): void {
		let isDragging = false;
		let dragStart: Point = { x: 0, y: 0 };
		let startPosition: Point = { ...this.data.position };

		this.element.addEventListener('mousedown', (e) => {
			if (e.target === this.deleteButton.querySelector('button')) return;

			isDragging = true;
			dragStart = { x: e.clientX, y: e.clientY };
			startPosition = { ...this.data.position };
			this.element.classList.add('selected');
			e.preventDefault();
		});

		document.addEventListener('mousemove', (e) => {
			if (!isDragging) return;

			const dx = e.clientX - dragStart.x;
			const dy = e.clientY - dragStart.y;

			// グリッドにスナップ
			const gridSize = this.getGridSize();
			this.data.position.x = this.snapToGrid(startPosition.x + dx, gridSize);
			this.data.position.y = this.snapToGrid(startPosition.y + dy, gridSize);

			this.updatePosition();
		});

		document.addEventListener('mouseup', () => {
			if (isDragging) {
				isDragging = false;
				this.element.classList.remove('selected');
			}
		});

		// 右クリックで回転
		this.element.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.rotate();
		});
	}

	private snapToGrid(value: number, gridSize: number): number {
		return Math.round(value / gridSize) * gridSize;
	}

	private getGridSize(): number {
		const gridSizeSelect = document.getElementById('grid-size') as HTMLSelectElement;
		return parseInt(gridSizeSelect.value);
	} private updatePosition(): void {
		const transform = `translate(${this.data.position.x}, ${this.data.position.y}) rotate(${this.data.rotation})`;
		this.element.setAttribute('transform', transform);
		// 削除ボタンの位置も更新
		this.deleteButton.setAttribute('x', `${this.data.position.x + 40}`);
		this.deleteButton.setAttribute('y', `${this.data.position.y - 10}`);

		debugPositioning(`Position updated: ${this.data.id} at (${this.data.position.x}, ${this.data.position.y}) rotation: ${this.data.rotation}°`);
	}

	private rotate(): void {
		this.data.rotation = (this.data.rotation + 90) % 360;
		debugPositioning(`Component rotated: ${this.data.id} to ${this.data.rotation}°`);
		this.updatePosition();
	}

	public getElement(): SVGGElement {
		return this.element;
	}

	public getDeleteButton(): SVGForeignObjectElement {
		return this.deleteButton;
	}

	public getData(): ComponentData {
		return { ...this.data };
	}

	public remove(): void {
		this.element.remove();
		this.deleteButton.remove();
		// カスタムイベントを発火して親に削除を通知
		const event = new CustomEvent('componentRemoved', { detail: this.data.id });
		document.dispatchEvent(event);
	}
}
