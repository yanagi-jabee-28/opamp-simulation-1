import { CircuitComponent } from './CircuitComponent.js';
import { ComponentData, ComponentType, Point } from './types.js';
import { debugCanvas, debugEvents } from './debug.js';
import { SVGManager } from './SVGManager.js';
import { ComponentRegistry } from './ComponentRegistry.js';
import { GridManager } from './GridManager.js';
import { PreviewManager } from './PreviewManager.js';

export class CircuitCanvas {
	private canvas: SVGSVGElement;
	private components: Map<string, CircuitComponent> = new Map();
	private nextId = 1;
	private isPlacing = false;
	private lastClickTime = 0;
	// マネージャークラス
	private svgManager!: SVGManager;
	private componentRegistry!: ComponentRegistry;
	private gridManager!: GridManager;
	private previewManager!: PreviewManager;

	constructor(canvasId: string) {
		this.canvas = document.getElementById(canvasId) as unknown as SVGSVGElement;
		if (!this.canvas) {
			console.error('Canvas element not found with ID:', canvasId);
			return;
		}
		debugCanvas('Canvas found and initialized');

		// マネージャークラスを初期化
		this.svgManager = new SVGManager();
		this.componentRegistry = new ComponentRegistry();
		this.gridManager = new GridManager(this.canvas);
		this.previewManager = new PreviewManager(
			this.canvas,
			this.svgManager,
			this.gridManager,
			this.componentRegistry
		);

		this.setupEventListeners();
		// すべてのSVGを事前ロード
		this.preloadAllSvgs();
	}

	private async preloadAllSvgs(): Promise<void> {
		const componentTypes = this.componentRegistry.getAllTypes();

		// 並列でSVGをロード
		const loadPromises = componentTypes.map(type => {
			const definition = this.componentRegistry.getDefinition(type);
			return definition ? this.svgManager.loadSvgContent(type, definition) : Promise.resolve(null);
		});
		await Promise.all(loadPromises);
		debugCanvas('All SVGs preloaded for instant preview');
	}

	private setupEventListeners(): void {
		debugCanvas('Setting up event listeners');

		// コンポーネント削除イベント
		document.addEventListener('componentRemoved', (e) => {
			const customEvent = e as CustomEvent;
			this.removeComponent(customEvent.detail);
		});

		// キャンバスクリックでコンポーネントを配置
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
				this.isPlacing = true;
				debugEvents('Setting isPlacing to true');

				const point = this.gridManager.getSnappedSvgPosition(e);
				debugEvents(`Mouse position: (${point.x}, ${point.y})`);

				this.addComponent(activeComponent, point);
				this.clearActiveComponent();

				// 配置完了後に即座にフラグをリセット
				this.isPlacing = false;
				debugEvents('isPlacing reset to false immediately');
			}
		});

		// コンポーネントパレットとコントロールの設定
		this.setupComponentPalette();
		this.setupControls();
	}

	private setupComponentPalette(): void {
		const componentItems = document.querySelectorAll('.component-item');
		debugCanvas(`Found ${componentItems.length} component items in palette`);

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

				// プレビューマネージャーにアクティブコンポーネントを設定
				this.previewManager.setActiveComponent(componentType);

				debugEvents('Component selected, cursor changed to crosshair');
			});
		});
	}

	private setupControls(): void {
		const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
		if (clearBtn) {
			clearBtn.addEventListener('click', () => {
				this.clearAll();
			});
		}

		const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
		if (exportBtn) {
			exportBtn.addEventListener('click', () => {
				this.exportToJSON();
			});
		}
	}

	private getActiveComponent(): ComponentType | null {
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

		// プレビューマネージャーをクリア
		this.previewManager.setActiveComponent(null);

		debugEvents('Active component cleared');
	}

	public addComponent(type: ComponentType, position: Point): void {
		debugCanvas(`addComponent called: ${type} at position: (${position.x}, ${position.y}) Total components before: ${this.components.size}`);

		const definition = this.componentRegistry.getDefinition(type);
		if (!definition) {
			console.error(`Definition not found for type:`, type);
			return;
		}
		const componentId = `component_${this.nextId++}`;
		const componentData: ComponentData = {
			id: componentId,
			type,
			position: this.gridManager.snapPointToGrid(position),
			rotation: 0,
			scale: 0.4  // プレビューと同じスケールを使用
		};

		debugCanvas(`Creating component with data:`, componentData);

		const component = new CircuitComponent(componentData, definition, this.svgManager);
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
				const definition = this.componentRegistry.getDefinition(componentData.type);
				if (definition) {
					const component = new CircuitComponent(componentData, definition, this.svgManager);
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

	// デバッグ用メソッド
	public getManagerInfo(): {
		svgCache: { svg: number; element: number; preview: number };
		gridInfo: { size: number; visible: boolean; bounds: DOMRect };
		componentsCount: number;
	} {
		return {
			svgCache: this.svgManager.getCacheInfo(),
			gridInfo: this.gridManager.getGridInfo(),
			componentsCount: this.components.size
		};
	}
}
