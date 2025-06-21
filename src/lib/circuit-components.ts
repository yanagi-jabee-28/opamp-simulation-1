/**
 * 電子回路部品ライブラリ (TypeScript版)
 * 再利用可能な電子回路素子のクラス定義
 * SVGファイルベースのコンポーネント対応
 */

export interface ComponentData {
	type: string;
	x: number;
	y: number;
	rotation: number;
	value?: string;
	timestamp: string;
}

export interface SVGElementProps {
	x1?: string | number;
	y1?: string | number;
	x2?: string | number;
	y2?: string | number;
	cx?: string | number;
	cy?: string | number;
	r?: string | number;
	x?: string | number;
	y?: string | number;
	width?: string | number;
	height?: string | number;
	d?: string;
	points?: string;
	stroke?: string;
	'stroke-width'?: string | number;
	'stroke-dasharray'?: string;
	fill?: string;
	'text-anchor'?: string;
	'font-family'?: string;
	'font-size'?: string | number;
	'font-weight'?: string;
	transform?: string;
	id?: string;
	href?: string;
	use?: string;
	preserveAspectRatio?: string;
	opacity?: string | number;
}

// SVGファイルを読み込むためのユーティリティ関数
export async function loadSVGFromFile(svgPath: string): Promise<SVGElement | null> {
	try {
		const response = await fetch(svgPath);

		if (!response.ok) {
			return null;
		}

		const svgText = await response.text();
		const parser = new DOMParser();
		const doc = parser.parseFromString(svgText, 'image/svg+xml');
		const svgElement = doc.querySelector('svg');

		return svgElement;
	} catch (error) {
		return null;
	}
}

// SVG内容を直接埋め込むためのユーティリティ関数（改良版）
export async function embedSVGContent(svgPath: string, targetGroup: SVGGElement, scale: number = 1): Promise<boolean> {
	try {
		console.log(`🎨 SVG埋め込み開始: ${svgPath}, scale: ${scale}`);
		const svgElement = await loadSVGFromFile(svgPath);
		if (!svgElement) {
			console.warn(`🎨❌ SVG要素取得失敗: ${svgPath}`);
			return false;
		}
		// 描画要素のみを抽出してクリーンアップ
		const extractDrawingElements = (element: Element): SVGElement[] => {
			const drawingElements: SVGElement[] = [];

			// 実際の描画要素のタグ名リスト
			const drawingTags = ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text'];

			if (drawingTags.includes(element.tagName.toLowerCase())) {
				const cleanElement = element.cloneNode(true) as SVGElement;
				// transform属性を完全に除去してクリーンな状態にする
				cleanElement.removeAttribute('transform');
				drawingElements.push(cleanElement);
			}

			// 子要素を再帰的に処理（g、defsなどのコンテナ要素も含む）
			Array.from(element.children).forEach(child => {
				drawingElements.push(...extractDrawingElements(child));
			});

			return drawingElements;
		};
		const drawingElements = extractDrawingElements(svgElement);
		console.log(`🎨 描画要素抽出: ${drawingElements.length}個の要素を発見`);

		// 各描画要素の詳細を表示
		drawingElements.forEach((element, index) => {
			console.log(`🎨 要素${index + 1}: ${element.tagName}`, {
				attributes: Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`),
				textContent: element.textContent?.trim() || 'なし'
			});
		});

		if (drawingElements.length === 0) {
			console.warn(`🎨⚠️ 描画要素なし: ${svgPath}`);
			return false;
		}

		// スケールアップした描画要素を追加
		drawingElements.forEach((element) => {
			// スケール変換を適用
			const currentTransform = element.getAttribute('transform') || '';
			element.setAttribute('transform', `${currentTransform} scale(${scale})`);

			// 色を強調してより見やすく
			if (element.getAttribute('stroke') && element.getAttribute('stroke') !== 'none') {
				element.setAttribute('stroke-width', String(parseFloat(element.getAttribute('stroke-width') || '1') * 2));
			}
			if (element.getAttribute('fill') && element.getAttribute('fill') !== 'none') {
				element.setAttribute('opacity', '0.8');
			}

			targetGroup.appendChild(element);
		});

		console.log(`🎨✅ SVG埋め込み完了: ${svgPath}, 追加要素数: ${drawingElements.length}`);
		return true;
	} catch (error) {
		console.error(`🎨💥 SVG埋め込みエラー: ${svgPath}`, error);
		return false;
	}
}

export abstract class CircuitComponent {
	public x: number;
	public y: number;
	public rotation: number;
	public width: number;
	public height: number;
	public terminalLength: number;
	public value?: string;
	protected svgPath?: string;	// 新機能: インタラクティブ編集
	public isSelected: boolean = false;
	public isEditing: boolean = false; constructor(x: number = 0, y: number = 0, rotation: number = 0, value?: string, svgPath?: string) {
		this.x = x;
		this.y = y;
		this.rotation = rotation;
		// 巨大サイズで素子を表示
		this.width = 1200;
		this.height = 800;
		this.terminalLength = 200;
		this.value = value;
		this.svgPath = svgPath;
	}

	protected applyTransform(element: SVGGElement): SVGGElement {
		if (this.rotation !== 0) {
			element.setAttribute('transform',
				`translate(${this.x}, ${this.y}) rotate(${this.rotation})`);
		} else {
			element.setAttribute('transform',
				`translate(${this.x}, ${this.y})`);
		}
		return element;
	}

	protected createGroup(id?: string): SVGGElement {
		const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		if (id) group.id = id;
		return this.applyTransform(group);
	}

	protected createElement<K extends keyof SVGElementTagNameMap>(
		tagName: K,
		props: SVGElementProps = {}
	): SVGElementTagNameMap[K] {
		const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);

		Object.entries(props).forEach(([key, value]) => {
			if (value !== undefined) {
				element.setAttribute(key, String(value));
			}
		});
		return element;
	}	// フォールバック要素を作成（革新的サイズ）
	protected createFallbackElement(): SVGElement {
		const rect = this.createElement('rect', {
			x: -this.width / 2,
			y: -this.height / 2,
			width: this.width,
			height: this.height,
			fill: '#ffeb3b',
			stroke: '#ff5722',
			'stroke-width': 20,
			'stroke-dasharray': '50,25',
			opacity: 0.9
		});
		return rect;
	}
	// 🚨 BoundingBox取得用のセーフなヘルパーメソッド
	protected getBoundingBoxSafe(element: SVGElement): any {
		try {
			const bbox = element.getBoundingClientRect();
			return {
				x: bbox.x,
				y: bbox.y,
				width: bbox.width,
				height: bbox.height
			};
		} catch (error) {
			console.warn('BoundingBox取得失敗:', error);
			return { x: 0, y: 0, width: 0, height: 0, error: String(error) };
		}
	}	// SVG直接埋め込みを使った描画
	protected async renderFromSVG(parentSvg: SVGSVGElement, id?: string): Promise<SVGGElement> {
		const group = this.createGroup(id);
		console.log(`🎨 ${this.constructor.name} SVG描画開始: ${this.svgPath}`);

		if (this.svgPath) {
			// SVGを部品サイズにスケールアップ
			const targetWidth = this.width;
			const targetHeight = this.height;

			// SVGをロードしてサイズを確認
			const svgElement = await loadSVGFromFile(this.svgPath);
			if (svgElement) {
				const originalViewBox = svgElement.getAttribute('viewBox');

				// viewBoxから実際のサイズを計算
				let svgWidth = 20; // デフォルト値
				let svgHeight = 20; // デフォルト値

				if (originalViewBox) {
					const viewBoxParts = originalViewBox.split(' ');
					if (viewBoxParts.length >= 4) {
						svgWidth = parseFloat(viewBoxParts[2]);
						svgHeight = parseFloat(viewBoxParts[3]);
					}
				}

				// スケール比率を計算（部品サイズに合わせる）
				const scaleX = targetWidth / svgWidth;
				const scaleY = targetHeight / svgHeight;
				const scale = Math.min(scaleX, scaleY) * 5; // 5倍調整

				console.log(`🎨 ${this.constructor.name} スケール計算: ${scale.toFixed(2)}x`); const success = await embedSVGContent(this.svgPath, group, scale);

				if (!success || group.children.length === 0) {
					console.log(`🎨 ${this.constructor.name} フォールバック描画実行`);
					// フォールバック：確実に見える巨大素子を描画
					while (group.firstChild) {
						group.removeChild(group.firstChild);
					}

					// 巨大で確実に見える矩形を描画
					const visibleRect = this.createElement('rect', {
						x: -targetWidth / 2,
						y: -targetHeight / 2,
						width: targetWidth,
						height: targetHeight,
						fill: '#ff9800',
						stroke: '#e65100',
						'stroke-width': 50,
						opacity: 0.9
					});
					group.appendChild(visibleRect);

					// 部品名を巨大に表示
					const nameLabel = this.createElement('text', {
						x: 0,
						y: 0,
						'text-anchor': 'middle',
						'font-family': 'Arial',
						'font-size': targetHeight * 0.4,
						'font-weight': 'bold',
						fill: '#fff',
						stroke: '#000',
						'stroke-width': 5
					});
					nameLabel.textContent = this.constructor.name;
					group.appendChild(nameLabel);
				} else {
					console.log(`🎨 ${this.constructor.name} SVG描画成功: ${group.children.length}個の要素`);
				}
			} else {
				// SVG読み込み失敗時のフォールバック
				const fallbackRect = this.createElement('rect', {
					x: -targetWidth / 2,
					y: -targetHeight / 2,
					width: targetWidth,
					height: targetHeight,
					fill: '#ff6b35',
					stroke: '#333',
					'stroke-width': 50,
					opacity: 0.8
				});
				group.appendChild(fallbackRect);
			}

			// 値のラベルを追加（巨大サイズ）
			if (this.value) {
				const label = this.createElement('text', {
					x: 0,
					y: targetHeight / 2 + 100,
					'text-anchor': 'middle',
					'font-family': 'Arial',
					'font-size': 200,
					'font-weight': 'bold',
					fill: '#333'
				});
				label.textContent = this.value;
				group.appendChild(label);
			}

			// 選択状態の可視化（巨大サイズ）
			if (this.isSelected) {
				const selectionRect = this.createElement('rect', {
					x: -targetWidth / 2 - 50,
					y: -targetHeight / 2 - 50,
					width: targetWidth + 100,
					height: targetHeight + 100,
					fill: 'none',
					stroke: '#007acc',
					'stroke-width': 20,
					'stroke-dasharray': '50,25'
				});
				group.appendChild(selectionRect);
			}
		}

		parentSvg.appendChild(group);

		return group;
	}

	// 新機能: 部品の選択状態設定
	public setSelected(selected: boolean): void {
		this.isSelected = selected;
	}

	// 新機能: 編集モード切り替え
	public setEditing(editing: boolean): void {
		this.isEditing = editing;
	}

	abstract render(parentSvg: SVGSVGElement, id?: string): SVGGElement | Promise<SVGGElement>;

	public toData(): ComponentData {
		return {
			type: this.constructor.name,
			x: this.x,
			y: this.y,
			rotation: this.rotation,
			value: this.value,
			timestamp: new Date().toISOString()
		};
	}
}

export class Resistor extends CircuitComponent {
	public color: string;

	constructor(x: number = 0, y: number = 0, rotation: number = 0, value: string = "R") {
		super(x, y, rotation, value, "/svg-components/resistor2.svg");
		this.color = "#e74c3c";
	}

	public async render(parentSvg: SVGSVGElement, id?: string): Promise<SVGGElement> {
		// SVGファイルが利用可能な場合は直接埋め込み方式を使用
		if (this.svgPath) {
			return await this.renderFromSVG(parentSvg, id);
		}
		// フォールバック: 従来の描画方式
		return this.renderFallback(parentSvg, id);
	} protected renderFallback(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		const group = this.createGroup(id);

		// 配線（極太、実際のterminalLengthを使用）
		const line1 = this.createElement('line', {
			x1: 0, y1: 0,
			x2: this.terminalLength, y2: 0,
			stroke: '#333', 'stroke-width': 80  // さらに極太
		});

		const line2 = this.createElement('line', {
			x1: this.terminalLength + this.width, y1: 0,
			x2: this.terminalLength + this.width + this.terminalLength, y2: 0,
			stroke: '#333', 'stroke-width': 80
		});

		// 抵抗器本体（実際のwidth/heightを使用）
		const rect = this.createElement('rect', {
			x: this.terminalLength,
			y: -this.height / 2,
			width: this.width,
			height: this.height,
			fill: 'none',
			stroke: '#333',
			'stroke-width': 80
		});

		// ジグザグパターン（動的サイズ計算）
		const zigzagSteps = 6; // ジグザグの段数
		const stepWidth = this.width / zigzagSteps; // 各段の幅
		const zigzagHeight = this.height * 0.6; // ジグザグの高さ（部品の60%）

		let zigzagPath = `M${this.terminalLength} 0`;
		for (let i = 1; i <= zigzagSteps; i++) {
			const x = this.terminalLength + i * stepWidth;
			const y = (i % 2 === 1) ? -zigzagHeight / 2 : zigzagHeight / 2;
			zigzagPath += ` L${x} ${y}`;
		}
		zigzagPath += ` L${this.terminalLength + this.width} 0`;

		const zigzag = this.createElement('path', {
			d: zigzagPath,
			fill: 'none',
			stroke: this.color,
			'stroke-width': 100  // さらに極太
		});

		// 端子（動的サイズ）
		const terminalRadius = Math.min(this.height, this.terminalLength) * 0.4;
		const terminal1 = this.createElement('circle', {
			cx: 0, cy: 0, r: terminalRadius, fill: '#333'
		});
		const terminal2 = this.createElement('circle', {
			cx: this.terminalLength + this.width + this.terminalLength,
			cy: 0, r: terminalRadius, fill: '#333'
		});

		// ラベル（動的サイズ）
		const fontSize = Math.min(this.width, this.height) * 0.3;
		const label = this.createElement('text', {
			x: this.terminalLength + this.width / 2,
			y: -this.height / 2 - fontSize / 2,
			'text-anchor': 'middle',
			'font-family': 'Arial',
			'font-size': fontSize,
			'font-weight': 'bold',
			fill: '#333'
		});
		label.textContent = this.value || 'R';

		// 🚨 各要素の詳細ログ
		console.log(`🎨🔧 Resistor要素作成詳細:`, {
			line1: { x1: 0, y1: 0, x2: this.terminalLength, y2: 0, strokeWidth: 80 },
			line2: { x1: this.terminalLength + this.width, y1: 0, x2: this.terminalLength + this.width + this.terminalLength, y2: 0 },
			rect: { x: this.terminalLength, y: -this.height / 2, width: this.width, height: this.height },
			zigzagPath: zigzagPath,
			terminalRadius: terminalRadius,
			fontSize: fontSize,
			totalWidth: this.terminalLength + this.width + this.terminalLength,
			totalHeight: this.height
		});

		// グループに追加
		[line1, line2, rect, zigzag, terminal1, terminal2, label].forEach(el => {
			group.appendChild(el);
		});

		// 🚨 グループ追加後の確認
		console.log(`🎨📋 Resistor要素群追加完了:`, {
			groupChildCount: group.children.length,
			groupTransform: group.getAttribute('transform'),
			elementsAdded: ['line1', 'line2', 'rect', 'zigzag', 'terminal1', 'terminal2', 'label']
		});

		parentSvg.appendChild(group);

		// 🚨 最終確認
		console.log(`🎨✅ Resistor描画完了:`, {
			parentSvgChildCount: parentSvg.children.length,
			groupBBox: this.getBoundingBoxSafe(group),
			svgViewBox: parentSvg.getAttribute('viewBox')
		});

		return group;
	}
}

export class Inductor extends CircuitComponent {
	public color: string;
	public coilRadius: number;
	public coilCount: number;

	constructor(x: number = 0, y: number = 0, rotation: number = 0, value: string = "L") {
		super(x, y, rotation, value, "/svg-components/inductor2.svg");
		this.color = "#2ecc71";
		this.coilRadius = 200;
		this.coilCount = 4;
	}

	public async render(parentSvg: SVGSVGElement, id?: string): Promise<SVGGElement> {
		// SVGファイルが利用可能な場合は直接埋め込み方式を使用
		if (this.svgPath) {
			return await this.renderFromSVG(parentSvg, id);
		}
		// フォールバック: 従来の描画方式
		return this.renderFallback(parentSvg, id);
	} protected renderFallback(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		const group = this.createGroup(id);

		// 配線（動的サイズ）
		const line1 = this.createElement('line', {
			x1: 0, y1: 0,
			x2: this.terminalLength, y2: 0,
			stroke: '#333', 'stroke-width': 80
		});

		const line2 = this.createElement('line', {
			x1: this.terminalLength + this.width, y1: 0,
			x2: this.terminalLength + this.width + this.terminalLength, y2: 0,
			stroke: '#333', 'stroke-width': 80
		});

		// コイル（動的サイズ計算）
		const dynamicCoilRadius = this.height * 0.4; // 部品高さの40%
		let coilPath = `M${this.terminalLength} 0`;
		for (let i = 0; i < this.coilCount; i++) {
			const x = this.terminalLength + (i + 1) * (this.width / this.coilCount);
			coilPath += ` A${dynamicCoilRadius} ${dynamicCoilRadius} 0 0 0 ${x} 0`;
		}
		const coil = this.createElement('path', {
			d: coilPath,
			fill: 'none',
			stroke: this.color,
			'stroke-width': 100
		});

		// 端子（動的サイズ）
		const terminalRadius = Math.min(this.height, this.terminalLength) * 0.4;
		const terminal1 = this.createElement('circle', {
			cx: 0, cy: 0, r: terminalRadius, fill: '#333'
		});

		const terminal2 = this.createElement('circle', {
			cx: this.terminalLength + this.width + this.terminalLength,
			cy: 0, r: terminalRadius, fill: '#333'
		});

		// ラベル（動的サイズ）
		const fontSize = Math.min(this.width, this.height) * 0.25;
		const label = this.createElement('text', {
			x: this.terminalLength + this.width / 2,
			y: -dynamicCoilRadius - fontSize / 2,
			'text-anchor': 'middle',
			'font-family': 'Arial',
			'font-size': fontSize,
			fill: '#333'
		});
		label.textContent = this.value || 'L';

		// グループに追加
		[line1, line2, coil, terminal1, terminal2, label].forEach(el => {
			group.appendChild(el);
		});

		parentSvg.appendChild(group);
		return group;
	}
}

export class Capacitor extends CircuitComponent {
	public color: string;
	public plateGap: number;
	public plateHeight: number;

	constructor(x: number = 0, y: number = 0, rotation: number = 0, value: string = "C") {
		super(x, y, rotation, value, "/svg-components/capacitor2.svg");
		this.color = "#9b59b6";
		this.plateGap = 200;
		this.plateHeight = 500;
	}

	public async render(parentSvg: SVGSVGElement, id?: string): Promise<SVGGElement> {
		// SVGファイルが利用可能な場合は直接埋め込み方式を使用
		if (this.svgPath) {
			return await this.renderFromSVG(parentSvg, id);
		}
		// フォールバック: 従来の描画方式
		return this.renderFallback(parentSvg, id);
	}

	protected renderFallback(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		const group = this.createGroup(id);

		const plateX1 = this.terminalLength + this.width / 2 - this.plateGap / 2;
		const plateX2 = this.terminalLength + this.width / 2 + this.plateGap / 2;		// 配線
		const line1 = this.createElement('line', {
			x1: 0, y1: 0,
			x2: plateX1, y2: 0,
			stroke: '#333', 'stroke-width': 30  // さらに太く
		});

		const line2 = this.createElement('line', {
			x1: plateX2, y1: 0,
			x2: this.terminalLength + this.width + this.terminalLength, y2: 0,
			stroke: '#333', 'stroke-width': 30
		});

		// 電極板
		const plate1 = this.createElement('line', {
			x1: plateX1,
			y1: -this.plateHeight / 2,
			x2: plateX1,
			y2: this.plateHeight / 2,
			stroke: this.color,
			'stroke-width': 50  // さらに太く
		});

		const plate2 = this.createElement('line', {
			x1: plateX2,
			y1: -this.plateHeight / 2,
			x2: plateX2,
			y2: this.plateHeight / 2,
			stroke: this.color,
			'stroke-width': 50
		});		// 端子
		const terminal1 = this.createElement('circle', {
			cx: 0, cy: 0, r: 40, fill: '#333'  // さらに大きく
		});

		const terminal2 = this.createElement('circle', {
			cx: this.terminalLength + this.width + this.terminalLength,
			cy: 0, r: 40, fill: '#333'
		});

		// ラベル
		const label = this.createElement('text', {
			x: this.terminalLength + this.width / 2,
			y: -this.plateHeight / 2 - 80,  // オフセット調整
			'text-anchor': 'middle',
			'font-family': 'Arial',
			'font-size': 120,  // さらに大きく
			'font-weight': 'bold',
			fill: '#333'
		});
		label.textContent = this.value || 'C';

		// グループに追加
		[line1, line2, plate1, plate2, terminal1, terminal2, label].forEach(el => {
			group.appendChild(el);
		});

		parentSvg.appendChild(group);
		return group;
	}
}

export interface ComponentInstance {
	component: CircuitComponent;
	element: SVGGElement;
	id?: string;
}

export class CircuitDiagram {
	public svg: SVGSVGElement;
	public components: ComponentInstance[];

	constructor(svgElement: SVGSVGElement) {
		this.svg = svgElement;
		this.components = [];
	} public async addComponent(component: CircuitComponent, id?: string): Promise<SVGGElement> {
		const element = await component.render(this.svg, id);

		this.components.push({
			component,
			element,
			id
		});

		return element;
	}

	public removeComponent(id: string): boolean {
		const index = this.components.findIndex(comp => comp.id === id);
		if (index !== -1) {
			this.components[index].element.remove();
			this.components.splice(index, 1);
			return true;
		}
		return false;
	}

	public getComponent(id: string): ComponentInstance | undefined {
		return this.components.find(comp => comp.id === id);
	}

	public clear(): void {
		this.components.forEach(comp => comp.element.remove());
		this.components = [];
	}

	public addWire(x1: number, y1: number, x2: number, y2: number, id?: string): SVGLineElement {
		const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('x1', String(x1));
		line.setAttribute('y1', String(y1));
		line.setAttribute('x2', String(x2));
		line.setAttribute('y2', String(y2));
		line.setAttribute('stroke', '#333');
		line.setAttribute('stroke-width', '2');
		if (id) line.id = id;

		this.svg.appendChild(line);
		return line;
	}
}

export class ComponentLibrary {
	private savedComponents: Record<string, ComponentData>;

	constructor() {
		this.savedComponents = this.loadFromStorage();
	}

	public saveComponent(name: string, component: CircuitComponent): ComponentData {
		const componentData = component.toData();
		this.savedComponents[name] = componentData;
		this.saveToStorage();
		return componentData;
	}

	public loadComponent(name: string): CircuitComponent | null {
		const data = this.savedComponents[name];
		if (!data) return null;
		switch (data.type) {
			case 'Resistor':
				return new Resistor(data.x, data.y, data.rotation, data.value);
			case 'Inductor':
				return new Inductor(data.x, data.y, data.rotation, data.value);
			case 'Capacitor':
				return new Capacitor(data.x, data.y, data.rotation, data.value);
			case 'CMOSN':
				return new CMOSN(data.x, data.y, data.rotation, data.value);
			case 'CMOSP':
				return new CMOSP(data.x, data.y, data.rotation, data.value);
			default:
				return null;
		}
	}

	public listComponents(): string[] {
		return Object.keys(this.savedComponents);
	}

	public deleteComponent(name: string): void {
		delete this.savedComponents[name];
		this.saveToStorage();
	}

	private saveToStorage(): void {
		localStorage.setItem('circuitComponents', JSON.stringify(this.savedComponents));
	}

	private loadFromStorage(): Record<string, ComponentData> {
		const saved = localStorage.getItem('circuitComponents');
		return saved ? JSON.parse(saved) : {};
	}

	public exportComponents(): string {
		return JSON.stringify(this.savedComponents, null, 2);
	}

	public importComponents(jsonString: string): boolean {
		try {
			const imported = JSON.parse(jsonString);
			this.savedComponents = { ...this.savedComponents, ...imported };
			this.saveToStorage();
			return true;
		} catch (error) {
			console.error('Import failed:', error);
			return false;
		}
	}

	public get components(): Record<string, ComponentData> {
		return { ...this.savedComponents };
	}
}

// MOSトランジスタの基底クラス (極めてシンプルなシンボル)
export abstract class MOSTransistor extends CircuitComponent {
	public transistorType: 'NMOS' | 'PMOS';
	constructor(x: number = 0, y: number = 0, rotation: number = 0, transistorType: 'NMOS' | 'PMOS' = 'NMOS', value?: string, svgPath?: string) {
		super(x, y, rotation, value, svgPath);
		this.width = 250;      // 5倍スケール (50 * 5)
		this.height = 250;     // 5倍スケール (50 * 5) 
		this.terminalLength = 100;  // 5倍スケール (20 * 5)
		this.transistorType = transistorType;
	}

	protected abstract renderFallback(parentSvg: SVGSVGElement, id?: string): SVGGElement;
	protected drawBasicStructure(group: SVGGElement): void {
		// メインの縦線（チャネル）- 5倍スケール
		const verticalLine = this.createElement('line', {
			x1: 0,
			y1: -100,  // -20 * 5
			x2: 0,
			y2: 100,   // 20 * 5
			stroke: '#000',
			'stroke-width': 8  // 2 * 4
		});
		group.appendChild(verticalLine);

		// ゲート（水平線）
		const gateLine = this.createElement('line', {
			x1: -75,  // -15 * 5
			y1: 0,
			x2: -25,  // -5 * 5
			y2: 0,
			stroke: '#000',
			'stroke-width': 8
		});
		group.appendChild(gateLine);

		// ゲート端子線
		const gateTerminal = this.createElement('line', {
			x1: -75 - this.terminalLength,  // (-15 * 5) - terminalLength
			y1: 0,
			x2: -75,
			y2: 0,
			stroke: '#000',
			'stroke-width': 8
		});
		group.appendChild(gateTerminal);

		// ドレイン接続線
		const drainLine = this.createElement('line', {
			x1: 0,
			y1: -100,  // -20 * 5
			x2: 75,    // 15 * 5
			y2: -100,
			stroke: '#000',
			'stroke-width': 8
		}); group.appendChild(drainLine);

		// ドレイン端子線
		const drainTerminal = this.createElement('line', {
			x1: 75,   // 15 * 5
			y1: -100,
			x2: 75,
			y2: -100 - this.terminalLength,
			stroke: '#000',
			'stroke-width': 8
		});
		group.appendChild(drainTerminal);

		// ソース接続線
		const sourceLine = this.createElement('line', {
			x1: 0,
			y1: 100,  // 20 * 5
			x2: 75,   // 15 * 5
			y2: 100,
			stroke: '#000',
			'stroke-width': 8
		});
		group.appendChild(sourceLine);

		// ソース端子線
		const sourceTerminal = this.createElement('line', {
			x1: 75,
			y1: 100,
			x2: 75,
			y2: 100 + this.terminalLength,
			stroke: '#000',
			'stroke-width': 8
		});
		group.appendChild(sourceTerminal);
	}

	protected drawLabels(group: SVGGElement): void {
		// ゲートラベル
		const gateLabel = this.createElement('text', {
			x: -75 - this.terminalLength - 25,  // -15*5 - terminalLength - 5*5
			y: 25,   // 5 * 5			'text-anchor': 'end',
			'font-family': 'Arial, sans-serif',
			'font-size': 60,  // 12 * 5
			fill: '#000'
		});
		gateLabel.textContent = 'G';
		group.appendChild(gateLabel);

		// ドレインラベル
		const drainLabel = this.createElement('text', {
			x: 100,   // 20 * 5
			y: -100 - this.terminalLength - 25,  // (-20 - terminalLength - 5) * 5
			'text-anchor': 'start',
			'font-family': 'Arial, sans-serif',
			'font-size': 60,
			fill: '#000'
		});
		drainLabel.textContent = 'D';
		group.appendChild(drainLabel);
		// ソースラベル
		const sourceLabel = this.createElement('text', {
			x: 100,   // 20 * 5
			y: 100 + this.terminalLength + 75,  // (20 + terminalLength + 15) * 5
			'text-anchor': 'start',
			'font-family': 'Arial, sans-serif',
			'font-size': 60,
			fill: '#000'
		});
		sourceLabel.textContent = 'S';
		group.appendChild(sourceLabel);

		// 値ラベル
		if (this.value) {
			const valueLabel = this.createElement('text', {
				x: 0,
				y: 225,  // 45 * 5
				'text-anchor': 'middle',
				'font-family': 'Arial, sans-serif',
				'font-size': 50,  // 10 * 5
				fill: '#666'
			});
			valueLabel.textContent = this.value;
			group.appendChild(valueLabel);
		}
	}
}

// NMOS トランジスタ (極めてシンプルなシンボル)
export class CMOSN extends MOSTransistor {
	constructor(x: number = 0, y: number = 0, rotation: number = 0, value?: string) {
		super(x, y, rotation, 'NMOS', value, "/svg-components/nmos-simple2.svg");
	}

	public async render(parentSvg: SVGSVGElement, id?: string): Promise<SVGGElement> {
		// SVGファイルが利用可能な場合は直接埋め込み方式を使用
		if (this.svgPath) {
			return await this.renderFromSVG(parentSvg, id);
		}
		// フォールバック: 従来の描画方式
		return this.renderFallback(parentSvg, id);
	}

	protected renderFallback(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		const group = this.createGroup(id);

		// 基本構造を描画
		this.drawBasicStructure(group);

		// NMOS特有の矢印（ソースからドレインへ）
		const arrow = this.createElement('polygon', {
			points: '5,0 2,-3 2,3',
			fill: '#000',
			stroke: '#000',
			'stroke-width': 1
		});
		group.appendChild(arrow);

		// タイプラベル
		const typeLabel = this.createElement('text', {
			x: 0,
			y: -30,
			'text-anchor': 'middle',
			'font-family': 'Arial, sans-serif',
			'font-size': 10,
			'font-weight': 'bold',
			fill: '#000'
		});
		typeLabel.textContent = 'NMOS';
		group.appendChild(typeLabel);

		this.drawLabels(group);
		parentSvg.appendChild(group);
		return group;
	}
}

// PMOS トランジスタ (極めてシンプルなシンボル)
export class CMOSP extends MOSTransistor {
	constructor(x: number = 0, y: number = 0, rotation: number = 0, value?: string) {
		super(x, y, rotation, 'PMOS', value, "/svg-components/pmos-simple2.svg");
	}

	public async render(parentSvg: SVGSVGElement, id?: string): Promise<SVGGElement> {
		// SVGファイルが利用可能な場合は直接埋め込み方式を使用
		if (this.svgPath) {
			return await this.renderFromSVG(parentSvg, id);
		}
		// フォールバック: 従来の描画方式
		return this.renderFallback(parentSvg, id);
	}

	protected renderFallback(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		const group = this.createGroup(id);

		// 基本構造を描画
		this.drawBasicStructure(group);

		// PMOS特有のゲートバブル
		const gateBubble = this.createElement('circle', {
			cx: -10,
			cy: 0,
			r: 3,
			fill: 'white',
			stroke: '#000',
			'stroke-width': 2
		});
		group.appendChild(gateBubble);

		// PMOS特有の矢印（ドレインからソースへ、NMOSとは逆向き）
		const arrow = this.createElement('polygon', {
			points: '2,0 5,-3 5,3',
			fill: '#000',
			stroke: '#000',
			'stroke-width': 1
		});
		group.appendChild(arrow);

		// タイプラベル
		const typeLabel = this.createElement('text', {
			x: 0,
			y: -30,
			'text-anchor': 'middle',
			'font-family': 'Arial, sans-serif',
			'font-size': 10,
			'font-weight': 'bold',
			fill: '#000'
		});
		typeLabel.textContent = 'PMOS';
		group.appendChild(typeLabel);

		this.drawLabels(group);
		parentSvg.appendChild(group);
		return group;
	}
}
