import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
	CircuitDiagram,
	ComponentLibrary,
	Resistor,
	Inductor,
	Capacitor,
	CMOSN,
	CMOSP,
	CircuitComponent,
	ComponentData
} from '../lib/circuit-components';

type ComponentType = 'resistor' | 'inductor' | 'capacitor' | 'cmosn' | 'cmosp';
type Tool = 'select' | 'place' | 'wire' | 'delete';

interface CircuitEditorProps {
	className?: string;
}

const CircuitEditor: React.FC<CircuitEditorProps> = ({ className = '' }) => {
	const svgRef = useRef<SVGSVGElement>(null);
	const [circuitDiagram, setCircuitDiagram] = useState<CircuitDiagram | null>(null);
	const [componentLibrary, setComponentLibrary] = useState<ComponentLibrary | null>(null);

	// ツール状態
	const [selectedTool, setSelectedTool] = useState<Tool>('select');
	const [selectedComponentType, setSelectedComponentType] = useState<ComponentType>('resistor');
	const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

	// 部品プロパティ
	const [componentValue, setComponentValue] = useState<string>('1k');
	const [rotation, setRotation] = useState<number>(0);

	// UI状態
	const [statusMessage, setStatusMessage] = useState<string>('回路エディタを初期化中...');
	const [componentCounter, setComponentCounter] = useState<number>(0);
	const [libraryItems, setLibraryItems] = useState<Record<string, ComponentData>>({});

	// キャンバス状態
	const [zoom, setZoom] = useState<number>(1);
	const [panX, setPanX] = useState<number>(0);
	const [panY, setPanY] = useState<number>(0);

	// 初期化
	useEffect(() => {
		if (svgRef.current) {
			const diagram = new CircuitDiagram(svgRef.current);
			const library = new ComponentLibrary();

			setCircuitDiagram(diagram);
			setComponentLibrary(library);
			setLibraryItems(library.components);
			setStatusMessage('初期化完了。ツールを選択して回路を編集してください。');
		}
	}, []);
	// 部品作成
	const createComponent = useCallback((type: ComponentType, value: string): CircuitComponent => {
		setComponentCounter(prev => prev + 1);

		switch (type) {
			case 'resistor':
				return new Resistor(0, 0, rotation, value || '1kΩ');
			case 'inductor':
				return new Inductor(0, 0, rotation, value || '1mH');
			case 'capacitor':
				return new Capacitor(0, 0, rotation, value || '1μF');
			case 'cmosn':
				return new CMOSN(0, 0, rotation, value || 'NMOS');
			case 'cmosp':
				return new CMOSP(0, 0, rotation, value || 'PMOS');
			default:
				return new Resistor(0, 0, rotation, value || '1kΩ');
		}
	}, [componentCounter, rotation]);

	// キャンバスクリック処理
	const handleCanvasClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
		if (!circuitDiagram || !svgRef.current) return;

		const rect = svgRef.current.getBoundingClientRect();
		const x = (event.clientX - rect.left - panX) / zoom;
		const y = (event.clientY - rect.top - panY) / zoom;
		if (selectedTool === 'place') {
			const component = createComponent(selectedComponentType, componentValue);
			component.x = Math.round(x / 20) * 20; // グリッドスナップ
			component.y = Math.round(y / 20) * 20;

			const id = `${selectedComponentType}_${Date.now()}_${componentCounter}`;
			circuitDiagram.addComponent(component, id);
			setStatusMessage(`${selectedComponentType}を配置しました (${component.x}, ${component.y})`);
		} else if (selectedTool === 'select') {
			// 部品選択ロジック（簡易版）
			const componentInstances = circuitDiagram.components;
			let selectedInstance = null;

			for (const instance of componentInstances) {
				const component = instance.component;
				const dx = x - component.x;
				const dy = y - component.y;
				if (Math.sqrt(dx * dx + dy * dy) < 30) {
					selectedInstance = instance;
					break;
				}
			}

			if (selectedInstance && selectedInstance.id) {
				setSelectedComponentId(selectedInstance.id);
				setComponentValue(selectedInstance.component.value || '');
				setRotation(selectedInstance.component.rotation);
				setStatusMessage(`${selectedInstance.id}を選択しました`);
			} else {
				setSelectedComponentId(null);
				setStatusMessage('部品の選択を解除しました');
			}
		}
	}, [circuitDiagram, selectedTool, selectedComponentType, componentValue, createComponent, zoom, panX, panY]);

	// 選択部品の削除
	const deleteSelectedComponent = useCallback(() => {
		if (!circuitDiagram || !selectedComponentId) return;

		circuitDiagram.removeComponent(selectedComponentId);
		setSelectedComponentId(null);
		setStatusMessage('選択した部品を削除しました');
	}, [circuitDiagram, selectedComponentId]);	// 選択部品のプロパティ更新
	const updateSelectedComponent = useCallback(async () => {
		if (!circuitDiagram || !selectedComponentId) return;

		const instance = circuitDiagram.components.find(c => c.id === selectedComponentId);
		if (instance) {
			instance.component.value = componentValue;
			instance.component.rotation = rotation;
			// 再描画（element.removeして再追加）
			instance.element.remove();
			const newElement = await instance.component.render(circuitDiagram.svg, instance.id);
			instance.element = newElement;
			setStatusMessage('部品のプロパティを更新しました');
		}
	}, [circuitDiagram, selectedComponentId, componentValue, rotation]);

	// キーボードショートカット
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Delete' && selectedComponentId) {
				deleteSelectedComponent();
			} else if (event.key === 'Escape') {
				setSelectedComponentId(null);
				setSelectedTool('select');
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [selectedComponentId, deleteSelectedComponent]);

	// 回路クリア
	const clearCircuit = useCallback(() => {
		if (!circuitDiagram) return;
		circuitDiagram.clear();
		setSelectedComponentId(null);
		setStatusMessage('回路をクリアしました');
	}, [circuitDiagram]);
	// 回路保存
	const saveCircuit = useCallback(() => {
		if (!circuitDiagram || !componentLibrary) return;

		const name = `Circuit_${new Date().toLocaleString()}`;
		// 個々の部品を保存（回路全体の保存機能は後で実装）
		circuitDiagram.components.forEach((instance, index) => {
			const componentName = `${name}_${index}`;
			componentLibrary.saveComponent(componentName, instance.component);
		});
		setLibraryItems({ ...componentLibrary.components });
		setStatusMessage(`回路の部品を "${name}" として保存しました`);
	}, [circuitDiagram, componentLibrary]);

	return (
		<div className={`h-screen flex flex-col bg-gray-100 ${className}`}>
			{/* ヘッダー */}
			<header className="bg-white shadow-md border-b border-gray-200 px-4 py-3">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold text-gray-800">🔧 Circuit Editor Pro</h1>
					<div className="flex items-center gap-4">
						<button
							onClick={saveCircuit}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
						>
							💾 保存
						</button>
						<button
							onClick={clearCircuit}
							className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
						>
							🗑️ クリア
						</button>
					</div>
				</div>
			</header>

			<div className="flex-1 flex overflow-hidden">
				{/* 左サイドバー - ツールパレット */}
				<div className="w-80 bg-white border-r border-gray-200 flex flex-col">
					{/* ツール選択 */}
					<div className="p-4 border-b border-gray-200">
						<h3 className="text-lg font-semibold text-gray-800 mb-3">🛠️ ツール</h3>
						<div className="grid grid-cols-2 gap-2">
							{[
								{ tool: 'select' as Tool, icon: '👆', label: '選択' },
								{ tool: 'place' as Tool, icon: '📍', label: '配置' },
								{ tool: 'wire' as Tool, icon: '🔗', label: '配線' },
								{ tool: 'delete' as Tool, icon: '🗑️', label: '削除' }
							].map(({ tool, icon, label }) => (
								<button
									key={tool}
									onClick={() => setSelectedTool(tool)}
									className={`p-3 rounded-md border-2 transition-all ${selectedTool === tool
											? 'border-blue-500 bg-blue-50 text-blue-700'
											: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
										}`}
								>
									<div className="text-xl mb-1">{icon}</div>
									<div className="text-sm font-medium">{label}</div>
								</button>
							))}
						</div>
					</div>

					{/* 部品パレット */}
					<div className="p-4 border-b border-gray-200">
						<h3 className="text-lg font-semibold text-gray-800 mb-3">🔌 部品</h3>
						<div className="space-y-2">
							{[
								{ type: 'resistor' as ComponentType, icon: '⚡', label: '抵抗器', color: 'text-yellow-600' },
								{ type: 'inductor' as ComponentType, icon: '🌀', label: 'インダクタ', color: 'text-green-600' },
								{ type: 'capacitor' as ComponentType, icon: '⚏', label: 'コンデンサ', color: 'text-blue-600' },
								{ type: 'cmosn' as ComponentType, icon: '🔺', label: 'NMOS', color: 'text-purple-600' },
								{ type: 'cmosp' as ComponentType, icon: '🔻', label: 'PMOS', color: 'text-red-600' }
							].map(({ type, icon, label, color }) => (
								<button
									key={type}
									onClick={() => {
										setSelectedComponentType(type);
										setSelectedTool('place');
									}}
									className={`w-full p-3 rounded-md border-2 text-left transition-all ${selectedComponentType === type && selectedTool === 'place'
											? 'border-blue-500 bg-blue-50'
											: 'border-gray-200 bg-white hover:border-gray-300'
										}`}
								>
									<div className="flex items-center gap-3">
										<span className={`text-xl ${color}`}>{icon}</span>
										<span className="font-medium text-gray-800">{label}</span>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* プロパティパネル */}
					<div className="p-4 border-b border-gray-200">
						<h3 className="text-lg font-semibold text-gray-800 mb-3">⚙️ プロパティ</h3>
						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									値
								</label>
								<input
									type="text"
									value={componentValue}
									onChange={(e) => setComponentValue(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="部品の値を入力"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									回転 ({rotation}°)
								</label>
								<input
									type="range"
									min="0"
									max="360"
									step="90"
									value={rotation}
									onChange={(e) => setRotation(Number(e.target.value))}
									className="w-full"
								/>
							</div>
							{selectedComponentId && (
								<div className="flex gap-2">
									<button
										onClick={updateSelectedComponent}
										className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
									>
										更新
									</button>
									<button
										onClick={deleteSelectedComponent}
										className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
									>
										削除
									</button>
								</div>
							)}
						</div>
					</div>

					{/* キャンバス制御 */}
					<div className="p-4">
						<h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 表示</h3>
						<div className="space-y-3">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									ズーム ({Math.round(zoom * 100)}%)
								</label>
								<input
									type="range"
									min="0.5"
									max="3"
									step="0.1"
									value={zoom}
									onChange={(e) => setZoom(Number(e.target.value))}
									className="w-full"
								/>
							</div>
							<button
								onClick={() => {
									setZoom(1);
									setPanX(0);
									setPanY(0);
								}}
								className="w-full px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
							>
								🎯 リセット
							</button>
						</div>
					</div>
				</div>

				{/* メインキャンバス */}
				<div className="flex-1 flex flex-col">
					{/* ステータスバー */}
					<div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-600">
								ツール: <span className="font-medium">{selectedTool}</span>
								{selectedTool === 'place' && (
									<span> | 部品: <span className="font-medium">{selectedComponentType}</span></span>
								)}
							</span>
							<span className="text-blue-600 font-medium">{statusMessage}</span>
						</div>
					</div>

					{/* SVGキャンバス */}
					<div className="flex-1 overflow-hidden bg-white relative">
						<svg
							ref={svgRef}
							className="w-full h-full cursor-crosshair"
							onClick={handleCanvasClick}
							style={{
								transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
								transformOrigin: 'top left'
							}}
						>
							{/* グリッド背景 */}
							<defs>
								<pattern
									id="grid"
									width="20"
									height="20"
									patternUnits="userSpaceOnUse"
								>
									<path
										d="M 20 0 L 0 0 0 20"
										fill="none"
										stroke="#e5e7eb"
										strokeWidth="0.5"
									/>
								</pattern>
							</defs>
							<rect width="100%" height="100%" fill="url(#grid)" />
							{/* 選択状態のハイライト */}
							{selectedComponentId && circuitDiagram && (
								(() => {
									const instance = circuitDiagram.components.find(c => c.id === selectedComponentId);
									return instance ? (
										<circle
											cx={instance.component.x}
											cy={instance.component.y}
											r="35"
											fill="none"
											stroke="#3b82f6"
											strokeWidth="2"
											strokeDasharray="5,5"
										>
											<animate
												attributeName="stroke-dashoffset"
												values="0;10"
												dur="1s"
												repeatCount="indefinite"
											/>
										</circle>
									) : null;
								})()
							)}
						</svg>
					</div>
				</div>

				{/* 右サイドバー - ライブラリ */}
				<div className="w-64 bg-white border-l border-gray-200">
					<div className="p-4">
						<h3 className="text-lg font-semibold text-gray-800 mb-3">📚 ライブラリ</h3>
						<div className="space-y-2 max-h-96 overflow-y-auto">
							{Object.entries(libraryItems).length === 0 ? (
								<p className="text-gray-500 text-sm">保存された回路がありません</p>
							) : (
								Object.entries(libraryItems).map(([name, data]) => (
									<div
										key={name}
										className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
									>
										<div className="font-medium text-gray-800 text-sm">{name}</div>
										<div className="text-xs text-gray-500 mt-1">
											{Array.isArray(data) ? data.length : 0} 部品
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CircuitEditor;
