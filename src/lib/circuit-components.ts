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
}

// SVGファイルを読み込むためのユーティリティ関数
export async function loadSVGFromFile(svgPath: string): Promise<SVGElement | null> {
	try {
		const response = await fetch(svgPath);
		if (!response.ok) {
			console.warn(`SVGファイルの読み込みに失敗: ${svgPath}`);
			return null;
		}
		const svgText = await response.text();
		const parser = new DOMParser();
		const doc = parser.parseFromString(svgText, 'image/svg+xml');
		const svgElement = doc.querySelector('svg');
		return svgElement;
	} catch (error) {
		console.error(`SVGファイルの読み込みエラー: ${svgPath}`, error);
		return null;
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
	protected svgPath?: string;

	constructor(x: number = 0, y: number = 0, rotation: number = 0, value?: string, svgPath?: string) {
		this.x = x;
		this.y = y;
		this.rotation = rotation;
		this.width = 100;
		this.height = 40;
		this.terminalLength = 40;
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
	}

	// SVGファイルから画像として読み込んで描画
	protected renderFromSVGFile(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		const group = this.createGroup(id);

		if (this.svgPath) {
			const image = this.createElement('image', {
				href: this.svgPath,
				x: -90, // 中央に配置するためのオフセット
				y: -40,
				width: 180,
				height: 80
			});
			group.appendChild(image);
		}

		parentSvg.appendChild(group);
		return group;
	}

	abstract render(parentSvg: SVGSVGElement, id?: string): SVGGElement;

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
		super(x, y, rotation, value, "/svg-components/resistor.svg");
		this.color = "#e74c3c";
	}

	public render(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		// SVGファイルが利用可能な場合はそちらを使用
		if (this.svgPath) {
			return this.renderFromSVGFile(parentSvg, id);
		}
		// フォールバック: 従来の描画方式
		return this.renderFallback(parentSvg, id);
	}

	protected renderFallback(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		const group = this.createGroup(id);

		// 配線
		const line1 = this.createElement('line', {
			x1: 0, y1: 0,
			x2: this.terminalLength, y2: 0,
			stroke: '#333', 'stroke-width': 2
		});

		const line2 = this.createElement('line', {
			x1: this.terminalLength + this.width, y1: 0,
			x2: this.terminalLength + this.width + this.terminalLength, y2: 0,
			stroke: '#333', 'stroke-width': 2
		});

		// 抵抗器本体
		const rect = this.createElement('rect', {
			x: this.terminalLength,
			y: -this.height / 2,
			width: this.width,
			height: this.height,
			fill: 'none',
			stroke: '#333',
			'stroke-width': 2
		});

		// ジグザグパターン
		const zigzagPath = `M${this.terminalLength + 10} 0 L${this.terminalLength + 20} -10 L${this.terminalLength + 30} 10 L${this.terminalLength + 40} -10 L${this.terminalLength + 50} 10 L${this.terminalLength + 60} -10 L${this.terminalLength + 70} 10 L${this.terminalLength + 80} -10 L${this.terminalLength + 90} 0`;
		const zigzag = this.createElement('path', {
			d: zigzagPath,
			fill: 'none',
			stroke: this.color,
			'stroke-width': 3
		});

		// 端子
		const terminal1 = this.createElement('circle', {
			cx: 0, cy: 0, r: 3, fill: '#333'
		});

		const terminal2 = this.createElement('circle', {
			cx: this.terminalLength + this.width + this.terminalLength,
			cy: 0, r: 3, fill: '#333'
		});

		// ラベル
		const label = this.createElement('text', {
			x: this.terminalLength + this.width / 2,
			y: -this.height / 2 - 5,
			'text-anchor': 'middle',
			'font-family': 'Arial',
			'font-size': 12,
			fill: '#333'
		});
		label.textContent = this.value || 'R';

		// グループに追加
		[line1, line2, rect, zigzag, terminal1, terminal2, label].forEach(el => {
			group.appendChild(el);
		});

		parentSvg.appendChild(group);
		return group;
	}
}

export class Inductor extends CircuitComponent {
	public color: string;
	public coilRadius: number;
	public coilCount: number;

	constructor(x: number = 0, y: number = 0, rotation: number = 0, value: string = "L") {
		super(x, y, rotation, value, "/svg-components/inductor.svg");
		this.color = "#2ecc71";
		this.coilRadius = 12.5;
		this.coilCount = 4;
	}

	public render(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		// SVGファイルが利用可能な場合はそちらを使用
		if (this.svgPath) {
			return this.renderFromSVGFile(parentSvg, id);
		}
		// フォールバック: 従来の描画方式
		return this.renderFallback(parentSvg, id);
	}

	protected renderFallback(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		const group = this.createGroup(id);

		// 配線
		const line1 = this.createElement('line', {
			x1: 0, y1: 0,
			x2: this.terminalLength, y2: 0,
			stroke: '#333', 'stroke-width': 2
		});

		const line2 = this.createElement('line', {
			x1: this.terminalLength + this.width, y1: 0,
			x2: this.terminalLength + this.width + this.terminalLength, y2: 0,
			stroke: '#333', 'stroke-width': 2
		});

		// コイル
		let coilPath = `M${this.terminalLength} 0`;
		for (let i = 0; i < this.coilCount; i++) {
			const x = this.terminalLength + (i + 1) * (this.width / this.coilCount);
			coilPath += ` A${this.coilRadius} ${this.coilRadius} 0 0 0 ${x} 0`;
		}

		const coil = this.createElement('path', {
			d: coilPath,
			fill: 'none',
			stroke: this.color,
			'stroke-width': 3
		});

		// 端子
		const terminal1 = this.createElement('circle', {
			cx: 0, cy: 0, r: 3, fill: '#333'
		});

		const terminal2 = this.createElement('circle', {
			cx: this.terminalLength + this.width + this.terminalLength,
			cy: 0, r: 3, fill: '#333'
		});

		// ラベル
		const label = this.createElement('text', {
			x: this.terminalLength + this.width / 2,
			y: -this.coilRadius - 10,
			'text-anchor': 'middle',
			'font-family': 'Arial',
			'font-size': 12,
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
		super(x, y, rotation, value, "/svg-components/capacitor.svg");
		this.color = "#9b59b6";
		this.plateGap = 20;
		this.plateHeight = 40;
	}

	public render(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		// SVGファイルが利用可能な場合はそちらを使用
		if (this.svgPath) {
			return this.renderFromSVGFile(parentSvg, id);
		}
		// フォールバック: 従来の描画方式
		return this.renderFallback(parentSvg, id);
	}

	protected renderFallback(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		const group = this.createGroup(id);

		const plateX1 = this.terminalLength + this.width / 2 - this.plateGap / 2;
		const plateX2 = this.terminalLength + this.width / 2 + this.plateGap / 2;

		// 配線
		const line1 = this.createElement('line', {
			x1: 0, y1: 0,
			x2: plateX1, y2: 0,
			stroke: '#333', 'stroke-width': 2
		});

		const line2 = this.createElement('line', {
			x1: plateX2, y1: 0,
			x2: this.terminalLength + this.width + this.terminalLength, y2: 0,
			stroke: '#333', 'stroke-width': 2
		});

		// 電極板
		const plate1 = this.createElement('line', {
			x1: plateX1,
			y1: -this.plateHeight / 2,
			x2: plateX1,
			y2: this.plateHeight / 2,
			stroke: this.color,
			'stroke-width': 4
		});

		const plate2 = this.createElement('line', {
			x1: plateX2,
			y1: -this.plateHeight / 2,
			x2: plateX2,
			y2: this.plateHeight / 2,
			stroke: this.color,
			'stroke-width': 4
		});

		// 端子
		const terminal1 = this.createElement('circle', {
			cx: 0, cy: 0, r: 3, fill: '#333'
		});

		const terminal2 = this.createElement('circle', {
			cx: this.terminalLength + this.width + this.terminalLength,
			cy: 0, r: 3, fill: '#333'
		});

		// ラベル
		const label = this.createElement('text', {
			x: this.terminalLength + this.width / 2,
			y: -this.plateHeight / 2 - 10,
			'text-anchor': 'middle',
			'font-family': 'Arial',
			'font-size': 12,
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
	}

	public addComponent(component: CircuitComponent, id?: string): SVGGElement {
		const element = component.render(this.svg, id);
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
		this.width = 50;
		this.height = 50;
		this.terminalLength = 20;
		this.transistorType = transistorType;
	}

	protected abstract renderFallback(parentSvg: SVGSVGElement, id?: string): SVGGElement;

	protected drawBasicStructure(group: SVGGElement): void {
		// メインの縦線（チャネル）
		const verticalLine = this.createElement('line', {
			x1: 0,
			y1: -20,
			x2: 0,
			y2: 20,
			stroke: '#000',
			'stroke-width': 2
		});
		group.appendChild(verticalLine);

		// ゲート（水平線）
		const gateLine = this.createElement('line', {
			x1: -15,
			y1: 0,
			x2: -5,
			y2: 0,
			stroke: '#000',
			'stroke-width': 2
		});
		group.appendChild(gateLine);

		// ゲート端子線
		const gateTerminal = this.createElement('line', {
			x1: -15 - this.terminalLength,
			y1: 0,
			x2: -15,
			y2: 0,
			stroke: '#000',
			'stroke-width': 2
		});
		group.appendChild(gateTerminal);

		// ドレイン接続線
		const drainLine = this.createElement('line', {
			x1: 0,
			y1: -20,
			x2: 15,
			y2: -20,
			stroke: '#000',
			'stroke-width': 2
		});
		group.appendChild(drainLine);

		// ドレイン端子線
		const drainTerminal = this.createElement('line', {
			x1: 15,
			y1: -20,
			x2: 15,
			y2: -20 - this.terminalLength,
			stroke: '#000',
			'stroke-width': 2
		});
		group.appendChild(drainTerminal);

		// ソース接続線
		const sourceLine = this.createElement('line', {
			x1: 0,
			y1: 20,
			x2: 15,
			y2: 20,
			stroke: '#000',
			'stroke-width': 2
		});
		group.appendChild(sourceLine);

		// ソース端子線
		const sourceTerminal = this.createElement('line', {
			x1: 15,
			y1: 20,
			x2: 15,
			y2: 20 + this.terminalLength,
			stroke: '#000',
			'stroke-width': 2
		});
		group.appendChild(sourceTerminal);
	}

	protected drawLabels(group: SVGGElement): void {
		// ゲートラベル
		const gateLabel = this.createElement('text', {
			x: -15 - this.terminalLength - 5,
			y: 5,
			'text-anchor': 'end',
			'font-family': 'Arial, sans-serif',
			'font-size': 12,
			fill: '#000'
		});
		gateLabel.textContent = 'G';
		group.appendChild(gateLabel);

		// ドレインラベル
		const drainLabel = this.createElement('text', {
			x: 20,
			y: -20 - this.terminalLength - 5,
			'text-anchor': 'start',
			'font-family': 'Arial, sans-serif',
			'font-size': 12,
			fill: '#000'
		});
		drainLabel.textContent = 'D';
		group.appendChild(drainLabel);

		// ソースラベル
		const sourceLabel = this.createElement('text', {
			x: 20,
			y: 20 + this.terminalLength + 15,
			'text-anchor': 'start',
			'font-family': 'Arial, sans-serif',
			'font-size': 12,
			fill: '#000'
		});
		sourceLabel.textContent = 'S';
		group.appendChild(sourceLabel);

		// 値ラベル
		if (this.value) {
			const valueLabel = this.createElement('text', {
				x: 0,
				y: 45,
				'text-anchor': 'middle',
				'font-family': 'Arial, sans-serif',
				'font-size': 10,
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
		super(x, y, rotation, 'NMOS', value, "/svg-components/nmos-simple.svg");
	}

	public render(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		// SVGファイルが利用可能な場合はそちらを使用
		if (this.svgPath) {
			return this.renderFromSVGFile(parentSvg, id);
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
		super(x, y, rotation, 'PMOS', value, "/svg-components/pmos-simple.svg");
	}

	public render(parentSvg: SVGSVGElement, id?: string): SVGGElement {
		// SVGファイルが利用可能な場合はそちらを使用
		if (this.svgPath) {
			return this.renderFromSVGFile(parentSvg, id);
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
