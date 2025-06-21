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
}

// SVGファイルを読み込むためのユーティリティ関数
export async function loadSVGFromFile(svgPath: string): Promise<SVGElement | null> {
	try {
		// 🚨 SVGファイル読み込みデバッグ
		console.log(`📂🔍 SVGファイル読み込み開始:`, { svgPath });

		const response = await fetch(svgPath);

		console.log(`📂📡 fetch結果:`, {
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
			url: response.url
		});

		if (!response.ok) {
			console.warn(`📂❌ SVGファイルの読み込みに失敗:`, {
				svgPath,
				status: response.status,
				statusText: response.statusText
			});
			return null;
		}

		const svgText = await response.text();
		console.log(`📂📄 SVGテキスト取得:`, {
			svgPath,
			textLength: svgText.length,
			textPreview: svgText.substring(0, 200) + '...'
		});

		const parser = new DOMParser();
		const doc = parser.parseFromString(svgText, 'image/svg+xml');
		const svgElement = doc.querySelector('svg');

		console.log(`📂🎨 SVG要素パース結果:`, {
			svgPath,
			svgElementFound: !!svgElement,
			svgChildCount: svgElement?.children.length || 0,
			svgViewBox: svgElement?.getAttribute('viewBox'),
			svgWidth: svgElement?.getAttribute('width'),
			svgHeight: svgElement?.getAttribute('height')
		});

		return svgElement;
	} catch (error) {
		console.error(`📂💥 SVGファイルの読み込みエラー:`, { svgPath, error });
		return null;
	}
}

// SVG内容を直接埋め込むためのユーティリティ関数
export async function embedSVGContent(svgPath: string, targetGroup: SVGGElement, scale: number = 1): Promise<boolean> {
	try {
		// 🚨 SVG埋め込みデバッグ
		console.log(`🎨📂 SVG埋め込み開始:`, { svgPath, scale, targetGroupId: targetGroup.id });

		const svgElement = await loadSVGFromFile(svgPath);
		if (!svgElement) {
			console.log(`🎨❌ SVG要素の取得に失敗:`, { svgPath });
			return false;
		}

		// SVGの内容をグループに移植
		const elements = Array.from(svgElement.children);
		console.log(`🎨🔧 SVG要素移植開始:`, {
			svgPath,
			elementsCount: elements.length,
			elementTypes: elements.map(el => el.tagName)
		});

		elements.forEach((child, index) => {
			const clonedChild = child.cloneNode(true) as SVGElement;
			if (scale !== 1) {
				const currentTransform = clonedChild.getAttribute('transform') || '';
				clonedChild.setAttribute('transform', `${currentTransform} scale(${scale})`);
			}
			targetGroup.appendChild(clonedChild);

			console.log(`🎨➕ 要素${index + 1}追加:`, {
				tagName: clonedChild.tagName,
				transform: clonedChild.getAttribute('transform'),
				id: clonedChild.id
			});
		});

		console.log(`🎨✅ SVG埋め込み完了:`, {
			svgPath,
			targetGroupChildCount: targetGroup.children.length
		});

		return true;
	} catch (error) {
		console.error(`🎨💥 SVG埋め込みエラー:`, { svgPath, error });
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
		// 🚀 極端に大きくする - グリッドサイズ(500px)を完全に上回る巨大サイズ
		this.width = 1200;      // 500pxグリッドの2.4倍
		this.height = 800;      // 500pxグリッドの1.6倍  
		this.terminalLength = 200;   // 端子も極大
		this.value = value;
		this.svgPath = svgPath;

		// 🔍 強化デバッグログ - 確実にサイズ確認
		console.log(`🚀📐 部品作成（超極大サイズ確定）:`, {
			type: this.constructor.name,
			coordinates: { x: this.x, y: this.y },
			size: { width: this.width, height: this.height },
			terminalLength: this.terminalLength,
			value: this.value,
			gridNote: '500pxグリッドを完全に覆う巨大サイズ',
			timestamp: new Date().toISOString()
		});
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
	// フォールバック要素を作成
	protected createFallbackElement(): SVGElement {
		const rect = this.createElement('rect', {
			x: -30,
			y: -15,
			width: 60,
			height: 30,
			fill: '#f0f0f0',
			stroke: '#999',
			'stroke-width': 1,
			'stroke-dasharray': '5,5'
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
	}
	// SVG直接埋め込みを使った描画
	protected async renderFromSVG(parentSvg: SVGSVGElement, id?: string): Promise<SVGGElement> {
		const group = this.createGroup(id);

		// 🚨 SVG描画デバッグ - 詳細ログ
		console.log(`🎨📐 SVG描画開始:`, {
			component: this.constructor.name,
			svgPath: this.svgPath,
			id: id,
			transform: group.getAttribute('transform'),
			position: { x: this.x, y: this.y },
			size: { width: this.width, height: this.height },
			value: this.value
		});

		if (this.svgPath) {
			const success = await embedSVGContent(this.svgPath, group, 1.0);

			// 🚨 SVG埋め込み結果デバッグ
			console.log(`🎨📂 SVG埋め込み結果:`, {
				success: success,
				svgPath: this.svgPath,
				groupChildCount: group.children.length,
				groupBBox: this.getBoundingBoxSafe(group)
			});

			if (!success) {
				// フォールバック描画
				console.log(`🚨 SVG読み込み失敗 - フォールバック描画実行`);
				group.appendChild(this.createFallbackElement());
			}

			// 値のラベルを追加
			if (this.value) {
				const label = this.createElement('text', {
					x: 0,
					y: 25,
					'text-anchor': 'middle',
					'font-family': 'Arial',
					'font-size': 10,
					fill: '#333'
				});
				label.textContent = this.value;
				group.appendChild(label);
			}

			// 選択状態の可視化
			if (this.isSelected) {
				const selectionRect = this.createElement('rect', {
					x: -35,
					y: -20,
					width: 70,
					height: 40,
					fill: 'none',
					stroke: '#007acc',
					'stroke-width': 2,
					'stroke-dasharray': '5,5'
				});
				group.appendChild(selectionRect);
			}
		}

		parentSvg.appendChild(group);

		// 🚨 最終的な要素の描画確認
		console.log(`🎨✅ SVG描画完了:`, {
			component: this.constructor.name,
			finalChildCount: group.children.length,
			parentSvgChildCount: parentSvg.children.length,
			groupBBox: this.getBoundingBoxSafe(group),
			svgViewBox: parentSvg.getAttribute('viewBox')
		});

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

		// 🔍 抵抗器サイズ再確認 - 確実に極大サイズを維持
		console.log(`🔴⚡ Resistor作成後サイズ確認:`, {
			width: this.width,
			height: this.height,
			terminalLength: this.terminalLength,
			color: this.color,
			coordinates: { x: this.x, y: this.y },
			value: this.value,
			note: '継承後のサイズが正しく設定されているか確認'
		});
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

		// 🎯 動的サイズ対応 - 部品サイズに合わせて全要素をスケーリング
		console.log(`🎨🔴 Resistor描画開始:`, {
			width: this.width,
			height: this.height,
			terminalLength: this.terminalLength,
			color: this.color,
			position: { x: this.x, y: this.y },
			rotation: this.rotation,
			value: this.value,
			note: '実際の描画に使用するサイズ'
		});

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

		// 🚀 ジグザグパターン（動的サイズ計算）
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
	public coilCount: number; constructor(x: number = 0, y: number = 0, rotation: number = 0, value: string = "L") {
		super(x, y, rotation, value, "/svg-components/inductor2.svg");
		this.color = "#2ecc71";
		this.coilRadius = 200;    // 極端に大きく (150 → 200)
		this.coilCount = 4;

		// 🔍 インダクタサイズ再確認
		console.log(`🟢⚡ Inductor作成後サイズ確認:`, {
			width: this.width,
			height: this.height,
			terminalLength: this.terminalLength,
			coilRadius: this.coilRadius,
			coilCount: this.coilCount,
			color: this.color,
			coordinates: { x: this.x, y: this.y },
			value: this.value
		});
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

		// 🎯 動的サイズ対応 - Inductor
		console.log(`🎨 Inductor描画開始:`, {
			width: this.width,
			height: this.height,
			terminalLength: this.terminalLength,
			coilRadius: this.coilRadius,
			note: 'インダクタの動的描画'
		});

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
	public plateHeight: number; constructor(x: number = 0, y: number = 0, rotation: number = 0, value: string = "C") {
		super(x, y, rotation, value, "/svg-components/capacitor2.svg");
		this.color = "#9b59b6";
		this.plateGap = 200;     // 極端に大きく (100 → 200)
		this.plateHeight = 500;  // 極端に大きく (200 → 500)
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
		// 🚨 部品追加デバッグ - 詳細ログ
		console.log(`📋🔧 CircuitDiagram.addComponent開始:`, {
			componentType: component.constructor.name,
			id: id,
			position: { x: component.x, y: component.y },
			size: { width: component.width, height: component.height },
			currentComponentsCount: this.components.length,
			svgChildrenCount: this.svg.children.length
		});

		const element = await component.render(this.svg, id);

		// 🚨 要素作成完了デバッグ
		console.log(`📋🎨 render完了:`, {
			elementCreated: !!element,
			elementTagName: element.tagName,
			elementId: element.id,
			elementTransform: element.getAttribute('transform'),
			elementChildCount: element.children.length,
			svgChildrenCountAfterRender: this.svg.children.length
		});

		this.components.push({
			component,
			element,
			id
		});

		// 🚨 最終状態確認
		console.log(`📋✅ addComponent完了:`, {
			finalComponentsCount: this.components.length,
			finalSvgChildrenCount: this.svg.children.length,
			addedComponentData: {
				type: component.constructor.name,
				id: id,
				position: { x: component.x, y: component.y },
				elementInDOM: document.contains(element)
			}
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
