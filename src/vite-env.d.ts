/// <reference types="vite/client" />

// 電子回路部品関連の型定義
export interface Position {
	x: number;
	y: number;
}

export interface ComponentProps {
	position: Position;
	rotation: number;
	value?: string;
	id?: string;
}

export interface CircuitComponentInterface {
	x: number;
	y: number;
	rotation: number;
	value?: string;
	render(parentSvg: SVGSVGElement, id?: string): SVGGElement;
	toData(): ComponentData;
}

export interface ComponentData {
	type: string;
	x: number;
	y: number;
	rotation: number;
	value?: string;
	timestamp: string;
}

export interface ComponentInstance {
	component: CircuitComponentInterface;
	element: SVGGElement;
	id?: string;
}

// イベント関連の型定義
export interface ComponentClickEvent {
	component: CircuitComponentInterface;
	element: SVGGElement;
	position: Position;
}

export interface WireConnection {
	from: Position;
	to: Position;
	id?: string;
}
