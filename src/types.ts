// 型定義
export interface Point {
	x: number;
	y: number;
}

export interface ComponentData {
	id: string;
	type: ComponentType;
	position: Point;
	rotation: number;
	scale: number;
}

export type ComponentType = 'resistor' | 'capacitor' | 'inductor' | 'nmos' | 'pmos';

export interface GridSettings {
	size: number;
	visible: boolean;
}

export interface ComponentDefinition {
	type: ComponentType;
	name: string;
	svgPath: string;
	defaultSize: { width: number; height: number };
}
