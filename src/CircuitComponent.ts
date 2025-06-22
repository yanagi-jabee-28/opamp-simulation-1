import { ComponentData, Point, ComponentDefinition } from './types.js';
import { debugComponent, debugSVG, debugPositioning } from './debug.js';
import { SVGManager } from './SVGManager.js';

export class CircuitComponent {
	private element: SVGGElement;
	private deleteButton: SVGForeignObjectElement;
	private svgManager: SVGManager;

	constructor(private data: ComponentData, private definition: ComponentDefinition, svgManager?: SVGManager) {
		debugComponent(`Creating CircuitComponent: ${data.type} ID: ${data.id}`);

		this.svgManager = svgManager || new SVGManager(); // 再利用可能なSVGManagerを使用
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

			// SVGManagerを使用してSVGコンテンツを取得
			const svgText = await this.svgManager.loadSvgContent(this.data.type, this.definition);
			if (!svgText) {
				throw new Error('Failed to load SVG content');
			}

			// SVGManagerを使用して要素を作成
			const svgElement = this.svgManager.createSvgElement(this.data.type, svgText, this.data.scale);

			// 作成された要素をグループに追加
			group.appendChild(svgElement);

			// 位置を更新
			this.updatePosition();
			debugSVG('SVG loaded successfully using SVGManager');
		} catch (error) {
			console.error(`SVGの読み込みに失敗しました (${this.definition.svgPath}):`, error);
			// フォールバック: SVGManagerを使用してフォールバック要素を作成
			const fallbackElement = this.svgManager.createFallbackElement(this.definition.name);
			group.appendChild(fallbackElement);
		}
	} private createDeleteButton(): SVGForeignObjectElement {
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
