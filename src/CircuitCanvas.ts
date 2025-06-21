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
				const componentType = item.getAttribute('data-component');
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
		debugEvents('Active component cleared');
	}

	private getMousePosition(e: MouseEvent): Point {
		const rect = this.canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// SVGの座標系に変換
		const svgPoint = this.canvas.createSVGPoint();
		svgPoint.x = x;
		svgPoint.y = y;
		const transformedPoint = svgPoint.matrixTransform(this.canvas.getScreenCTM()?.inverse());

		// グリッドにスナップ
		return {
			x: this.snapToGrid(transformedPoint.x),
			y: this.snapToGrid(transformedPoint.y)
		};
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
}
