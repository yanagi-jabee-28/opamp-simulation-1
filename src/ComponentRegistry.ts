import { ComponentType, ComponentDefinition } from './types.js';

/**
 * コンポーネント定義の管理を行うクラス
 */
export class ComponentRegistry {
	private definitions: Map<ComponentType, ComponentDefinition> = new Map();

	constructor() {
		this.initializeDefinitions();
	}

	/**
	 * コンポーネント定義を初期化
	 */
	private initializeDefinitions(): void {
		const definitions: ComponentDefinition[] = [
			{
				type: 'resistor',
				name: '抵抗',
				svgPath: './svg-components/resistor2.svg',
				defaultSize: { width: 80, height: 30 }
			},
			{
				type: 'capacitor',
				name: 'コンデンサ',
				svgPath: './svg-components/capacitor2.svg',
				defaultSize: { width: 60, height: 40 }
			},
			{
				type: 'inductor',
				name: 'インダクタ',
				svgPath: './svg-components/inductor2.svg',
				defaultSize: { width: 80, height: 30 }
			},
			{
				type: 'nmos',
				name: 'NMOS',
				svgPath: './svg-components/nmos-simple2.svg',
				defaultSize: { width: 50, height: 50 }
			},
			{
				type: 'pmos',
				name: 'PMOS',
				svgPath: './svg-components/pmos-simple2.svg',
				defaultSize: { width: 50, height: 50 }
			}
		];

		definitions.forEach(def => {
			this.definitions.set(def.type, def);
		});
	}

	/**
	 * コンポーネント定義を取得
	 */
	getDefinition(type: ComponentType): ComponentDefinition | undefined {
		return this.definitions.get(type);
	}

	/**
	 * すべてのコンポーネント定義を取得
	 */
	getAllDefinitions(): Map<ComponentType, ComponentDefinition> {
		return new Map(this.definitions);
	}

	/**
	 * すべてのコンポーネントタイプを取得
	 */
	getAllTypes(): ComponentType[] {
		return Array.from(this.definitions.keys());
	}

	/**
	 * コンポーネント定義を追加
	 */
	addDefinition(definition: ComponentDefinition): void {
		this.definitions.set(definition.type, definition);
	}

	/**
	 * コンポーネント定義を削除
	 */
	removeDefinition(type: ComponentType): boolean {
		return this.definitions.delete(type);
	}

	/**
	 * 定義が存在するかチェック
	 */
	hasDefinition(type: ComponentType): boolean {
		return this.definitions.has(type);
	}
}
