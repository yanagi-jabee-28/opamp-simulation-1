import { CircuitComponent } from './CircuitComponent.js';
import { ComponentData, ComponentType, Point, GridSettings, ComponentDefinition } from './types.js';
import { debugCanvas, debugEvents, debugUI } from './debug.js';

export class CircuitCanvas {
	private canvas: SVGSVGElement;
	private components: Map<string, CircuitComponent> = new Map();
	private componentDefinitions: Map<ComponentType, ComponentDefinition> = new Map();
	private gridSettings: GridSettings = { size: 30, visible: true };
	private nextId = 1;
	private isPlacing = false; // 配置中フラグを追加
	private lastClickTime = 0; // 最後のクリック時刻を追加
	private previewElement: SVGGElement | null = null; // プレビュー要素
	private activeComponentType: ComponentType | null = null; // 選択中のコンポーネント
	constructor(canvasId: string) {
		this.canvas = document.getElementById(canvasId) as unknown as SVGSVGElement;
		if (!this.canvas) {
			console.error('Canvas element not found with ID:', canvasId);
			return;
		}
		debugCanvas('Canvas found and initialized');
		this.componentDefinitions = this.initializeComponentDefinitions();
		this.setupEventListeners();
		this.updateGrid();
		// すべてのSVGを事前ロード
		this.preloadAllSvgs();
	}

	private initializeComponentDefinitions(): Map<ComponentType, ComponentDefinition> {
		const definitions = new Map<ComponentType, ComponentDefinition>();

		definitions.set('resistor', {
			type: 'resistor',
			name: '抵抗',
			svgPath: './svg-components/resistor2.svg',
			defaultSize: { width: 80, height: 30 }
		});

		definitions.set('capacitor', {
			type: 'capacitor',
			name: 'コンデンサ',
			svgPath: './svg-components/capacitor2.svg',
			defaultSize: { width: 60, height: 40 }
		});

		definitions.set('inductor', {
			type: 'inductor',
			name: 'インダクタ',
			svgPath: './svg-components/inductor2.svg',
			defaultSize: { width: 80, height: 30 }
		});

		definitions.set('nmos', {
			type: 'nmos',
			name: 'NMOS',
			svgPath: './svg-components/nmos-simple2.svg',
			defaultSize: { width: 50, height: 50 }
		});

		definitions.set('pmos', {
			type: 'pmos',
			name: 'PMOS',
			svgPath: './svg-components/pmos-simple2.svg',
			defaultSize: { width: 50, height: 50 }
		});

		return definitions;
	} private setupEventListeners(): void {
		debugCanvas('Setting up event listeners');
		// ドラッグ&ドロップの処理
		document.addEventListener('componentRemoved', (e) => {
			const customEvent = e as CustomEvent;
			this.removeComponent(customEvent.detail);
		});

		// プレビュークリアイベント
		document.addEventListener('clearPreview', () => {
			this.setActiveComponent(null);
		});

		// キャンバスクリックでコンポーネントをドロップ
		this.canvas.addEventListener('click', (e) => {
			const timestamp = Date.now();
			debugEvents(`Canvas clicked at: ${e.clientX}, ${e.clientY}`);
			debugEvents(`isPlacing status: ${this.isPlacing}`);

			// 短時間での重複クリックを防止
			if (timestamp - this.lastClickTime < 200) {
				debugEvents('Ignoring rapid click (within 200ms)');
				return;
			}
			this.lastClickTime = timestamp;

			// 既に配置処理中の場合は無視
			if (this.isPlacing) {
				debugEvents('Already placing, ignoring click');
				return;
			}

			const activeComponent = this.getActiveComponent();
			debugEvents(`Active component: ${activeComponent}`);
			if (activeComponent) {
				this.isPlacing = true; // 配置処理開始
				debugEvents('Setting isPlacing to true');

				const point = this.getMousePosition(e);
				debugEvents(`Mouse position: (${point.x}, ${point.y})`);

				this.addComponent(activeComponent, point);
				this.clearActiveComponent();

				// 配置完了後に即座にフラグをリセット
				this.isPlacing = false;
				debugEvents('isPlacing reset to false immediately');
			}
		});		// マウス移動でプレビュー表示（即座に反応）
		this.canvas.addEventListener('mousemove', (e) => {
			if (this.activeComponentType && !this.isPlacing) {
				this.updatePreviewSync(e);
			}
		});

		// マウスが離れたらプレビューを非表示
		this.canvas.addEventListener('mouseleave', () => {
			this.hidePreview();
		});

		// グリッド設定の変更
		const gridSizeSelect = document.getElementById('grid-size') as HTMLSelectElement;
		gridSizeSelect.addEventListener('change', () => {
			this.gridSettings.size = parseInt(gridSizeSelect.value);
			this.updateGrid();
		});

		const showGridCheckbox = document.getElementById('show-grid') as HTMLInputElement;
		showGridCheckbox.addEventListener('change', () => {
			this.gridSettings.visible = showGridCheckbox.checked;
			this.updateGrid();
		});

		// コンポーネントパレットの設定
		this.setupComponentPalette();

		// コントロールボタンの設定
		this.setupControls();
	} private setupComponentPalette(): void {
		const componentItems = document.querySelectorAll('.component-item');
		debugUI(`Found ${componentItems.length} component items in palette`);

		componentItems.forEach(item => {
			item.addEventListener('click', () => {
				const componentType = item.getAttribute('data-component') as ComponentType;
				debugEvents(`Component item clicked: ${componentType}`);
				debugEvents(`isPlacing status: ${this.isPlacing}`);

				// 配置中の場合は選択をキャンセル
				if (this.isPlacing) {
					debugEvents('Currently placing, canceling selection');
					return;
				}

				// 他のアイテムの選択状態をクリア
				componentItems.forEach(i => i.classList.remove('selected'));
				// このアイテムを選択状態に
				item.classList.add('selected');
				// キャンバスの状態を変更
				this.canvas.style.cursor = 'crosshair';

				// アクティブコンポーネントを設定（プレビュー用）
				this.setActiveComponent(componentType);

				debugEvents('Component selected, cursor changed to crosshair');
			});
		});
	}

	private setupControls(): void {
		const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
		clearBtn.addEventListener('click', () => {
			this.clearAll();
		});

		const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
		exportBtn.addEventListener('click', () => {
			this.exportToJSON();
		});
	} private getActiveComponent(): ComponentType | null {
		const selectedItem = document.querySelector('.component-item.selected') as HTMLElement;
		debugEvents(`getActiveComponent - Selected item:`, selectedItem);
		if (selectedItem) {
			const componentType = selectedItem.dataset.component as ComponentType;
			debugEvents(`getActiveComponent - Component type: ${componentType}`);
			return componentType;
		}
		debugEvents('getActiveComponent - No component selected');
		return null;
	}
	private clearActiveComponent(): void {
		const selectedItems = document.querySelectorAll('.component-item.selected');
		debugEvents(`clearActiveComponent - Found selected items: ${selectedItems.length}`);
		selectedItems.forEach(item => {
			item.classList.remove('selected');
		});
		this.canvas.style.cursor = 'default';

		// アクティブコンポーネントとプレビューをクリア
		this.setActiveComponent(null);

		debugEvents('Active component cleared');
	} private getMousePosition(e: MouseEvent): Point {
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
		const snappedPoint = {
			x: this.snapToGrid(svgX),
			y: this.snapToGrid(svgY)
		};

		return snappedPoint;
	}

	private snapToGrid(value: number): number {
		return Math.round(value / this.gridSettings.size) * this.gridSettings.size;
	} public addComponent(type: ComponentType, position: Point): void {
		debugCanvas(`addComponent called: ${type} at position: (${position.x}, ${position.y}) Total components before: ${this.components.size}`);

		const definition = this.componentDefinitions.get(type);
		if (!definition) {
			console.error(`Definition not found for type:`, type);
			return;
		}

		const componentId = `component_${this.nextId++}`;
		const componentData: ComponentData = {
			id: componentId,
			type,
			position: {
				x: this.snapToGrid(position.x),
				y: this.snapToGrid(position.y)
			},
			rotation: 0,
			scale: 1.0 // SVGファイルを直接使用するのでスケールを1.0に
		};

		debugCanvas(`Creating component with data:`, componentData);

		const component = new CircuitComponent(componentData, definition);
		this.components.set(componentData.id, component);

		debugCanvas('Component created, adding to canvas');
		this.canvas.appendChild(component.getElement());
		this.canvas.appendChild(component.getDeleteButton());

		debugCanvas(`Component added successfully. Total components now: ${this.components.size}`);
	}

	public removeComponent(id: string): void {
		const component = this.components.get(id);
		if (component) {
			this.components.delete(id);
		}
	}

	public clearAll(): void {
		this.components.forEach(component => {
			component.remove();
		});
		this.components.clear();
		this.nextId = 1;
	}

	private updateGrid(): void {
		const gridPattern = this.canvas.querySelector('#grid') as SVGPatternElement;
		if (gridPattern) {
			gridPattern.setAttribute('width', this.gridSettings.size.toString());
			gridPattern.setAttribute('height', this.gridSettings.size.toString());
		}

		const gridBackground = this.canvas.querySelector('.grid-background') as SVGRectElement;
		if (gridBackground) {
			if (this.gridSettings.visible) {
				gridBackground.classList.remove('hidden');
			} else {
				gridBackground.classList.add('hidden');
			}
		}
	}

	public exportToJSON(): void {
		const data = Array.from(this.components.values()).map(component => component.getData());
		const json = JSON.stringify(data, null, 2);

		// JSONをダウンロード
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'circuit-design.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	public importFromJSON(json: string): void {
		try {
			const data = JSON.parse(json) as ComponentData[];
			this.clearAll();

			data.forEach(componentData => {
				const definition = this.componentDefinitions.get(componentData.type);
				if (definition) {
					const component = new CircuitComponent(componentData, definition);
					this.components.set(componentData.id, component);
					this.canvas.appendChild(component.getElement());
					this.canvas.appendChild(component.getDeleteButton());

					// IDカウンターを更新
					const idNum = parseInt(componentData.id.split('_')[1]);
					if (idNum >= this.nextId) {
						this.nextId = idNum + 1;
					}
				}
			});
		} catch (error) {
			console.error('インポートに失敗しました:', error);
			alert('ファイルの形式が正しくありません。');
		}
	}
	// プレビュー関連のメソッド
	private previewSvgCache: Map<ComponentType, string> = new Map(); // SVGキャッシュ
	private isUpdatingPreview = false; // プレビュー更新中フラグ

	private async loadSvgContent(componentType: ComponentType): Promise<string | null> {
		// キャッシュから取得
		if (this.previewSvgCache.has(componentType)) {
			return this.previewSvgCache.get(componentType) || null;
		}

		const definition = this.componentDefinitions.get(componentType);
		if (!definition) return null;

		try {
			const response = await fetch(definition.svgPath);
			const svgText = await response.text();
			// キャッシュに保存
			this.previewSvgCache.set(componentType, svgText);
			return svgText;
		} catch (error) {
			console.error(`Failed to load SVG for ${componentType}:`, error);
			return null;
		}
	}

	private createPreviewElement(svgText: string): SVGGElement {
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
		const svgElement = svgDoc.documentElement;

		// プレビュー用のグループを作成
		const previewGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		previewGroup.classList.add('component-preview');

		// SVGの viewBox を取得してスケールを計算
		const viewBox = svgElement.getAttribute('viewBox');
		let scale = 0.4; // デフォルトスケール
		if (viewBox) {
			const [, , width, height] = viewBox.split(' ').map(Number);
			const targetSize = 80;
			const scaleX = targetSize / width;
			const scaleY = targetSize / height;
			scale = Math.min(scaleX, scaleY, 0.4);
		}

		// metadata, defs, namedviewなどの非表示要素を除く有効な子要素のみを取得
		const validChildren = Array.from(svgElement.children).filter(child => {
			const tagName = child.tagName.toLowerCase();
			return tagName !== 'metadata' && tagName !== 'defs' &&
				tagName !== 'namedview' && tagName !== 'sodipodi:namedview' &&
				tagName !== 'title' && tagName !== 'desc';
		});

		// SVGの内容をクローンして追加
		const svgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		if (validChildren.length > 0) {
			validChildren.forEach((child) => {
				const clonedElement = child.cloneNode(true) as SVGElement;
				svgGroup.appendChild(clonedElement);
			});
		} else {
			// フォールバック: 表示可能な要素を直接検索
			const visibleElements = svgElement.querySelectorAll('path, rect, circle, line, polyline, polygon, ellipse, g');
			visibleElements.forEach((element) => {
				if (element.parentElement === svgElement) {
					const clonedElement = element.cloneNode(true) as SVGElement;
					svgGroup.appendChild(clonedElement);
				}
			});
		}

		// スケールを適用
		svgGroup.setAttribute('transform', `scale(${scale})`);
		previewGroup.appendChild(svgGroup);

		return previewGroup;
	}
	private updatePreviewSync(e: MouseEvent): void {
		if (!this.activeComponentType || this.isUpdatingPreview) return;

		const point = this.getMousePosition(e);

		// グリッドにスナップした位置に配置
		const snappedPoint = {
			x: this.snapToGrid(point.x),
			y: this.snapToGrid(point.y)
		};

		// 既にプレビューが存在し、キャッシュされたSVGがある場合は位置のみ更新
		if (this.previewElement && this.previewSvgCache.has(this.activeComponentType)) {
			this.previewElement.setAttribute('transform', `translate(${snappedPoint.x}, ${snappedPoint.y})`);
			return;
		}

		// プレビューが存在しない場合は非同期で作成
		if (!this.previewElement) {
			this.updatePreviewAsync(e);
		}
	}

	private async updatePreviewAsync(e: MouseEvent): Promise<void> {
		if (!this.activeComponentType || this.isUpdatingPreview) return;

		this.isUpdatingPreview = true;

		try {
			const point = this.getMousePosition(e);

			// 既存のプレビューを削除
			this.hidePreview();

			// SVGコンテンツを取得（キャッシュ使用）
			const svgText = await this.loadSvgContent(this.activeComponentType);
			if (!svgText) return;

			// プレビュー要素を作成
			this.previewElement = this.createPreviewElement(svgText);

			// グリッドにスナップした位置に配置
			const snappedPoint = {
				x: this.snapToGrid(point.x),
				y: this.snapToGrid(point.y)
			};

			this.previewElement.setAttribute('transform', `translate(${snappedPoint.x}, ${snappedPoint.y})`);
			this.canvas.appendChild(this.previewElement);

		} finally {
			this.isUpdatingPreview = false;
		}
	}

	private hidePreview(): void {
		// 既存のプレビューをすべて削除（念のため）
		const existingPreviews = this.canvas.querySelectorAll('.component-preview');
		existingPreviews.forEach(preview => preview.remove());

		if (this.previewElement) {
			this.previewElement.remove();
			this.previewElement = null;
		}
	}
	private setActiveComponent(componentType: ComponentType | null): void {
		this.activeComponentType = componentType;

		// プレビューをクリア
		this.hidePreview();

		// 新しいコンポーネントが選択された場合、SVGを事前にロード
		if (componentType) {
			this.preloadSvgContent(componentType);
		}
	}

	private async preloadSvgContent(componentType: ComponentType): Promise<void> {
		// 既にキャッシュされている場合はスキップ
		if (this.previewSvgCache.has(componentType)) return;

		const definition = this.componentDefinitions.get(componentType);
		if (!definition) return;

		try {
			const response = await fetch(definition.svgPath);
			const svgText = await response.text();
			this.previewSvgCache.set(componentType, svgText);
		} catch (error) {
			console.error(`Failed to preload SVG for ${componentType}:`, error);
		}
	}

	private async preloadAllSvgs(): Promise<void> {
		const componentTypes: ComponentType[] = ['resistor', 'capacitor', 'inductor', 'nmos', 'pmos'];

		// 並列でSVGをロード
		const loadPromises = componentTypes.map(type => this.preloadSvgContent(type));
		await Promise.all(loadPromises);
		debugCanvas('All SVGs preloaded for instant preview');
	}
}
