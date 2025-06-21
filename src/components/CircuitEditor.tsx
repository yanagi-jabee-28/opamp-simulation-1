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
	// キャンバス状態（viewBox ベース）
	const [viewBoxX, setViewBoxX] = useState<number>(-5000);
	const [viewBoxY, setViewBoxY] = useState<number>(-5000);
	const [viewBoxWidth, setViewBoxWidth] = useState<number>(10000);
	const [viewBoxHeight, setViewBoxHeight] = useState<number>(10000);
	const [zoom, setZoom] = useState<number>(1);	// マウス位置とズーム視覚効果
	const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
	const [showZoomIndicator, setShowZoomIndicator] = useState<boolean>(false);
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

	// 🔧 wheelイベントのpassive対応 - non-passiveリスナーでpreventDefault可能に
	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return;

		const wheelHandler = (event: WheelEvent) => {
			event.preventDefault(); // non-passiveなのでpreventDefaultが有効
		};

		// non-passiveでwheelイベントを登録
		svg.addEventListener('wheel', wheelHandler, { passive: false });

		return () => {
			svg.removeEventListener('wheel', wheelHandler);
		};
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
	}, [componentCounter, rotation]);	// キャンバスクリック処理（viewBox専用ズーム対応）
	const handleCanvasClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
		if (!circuitDiagram || !svgRef.current) return;

		const rect = svgRef.current.getBoundingClientRect();

		// クライアント座標を取得
		const clientX = event.clientX - rect.left;
		const clientY = event.clientY - rect.top;

		// viewBox座標系に変換
		const x = viewBoxX + (clientX / rect.width) * viewBoxWidth;
		const y = viewBoxY + (clientY / rect.height) * viewBoxHeight; if (selectedTool === 'place') {
			const component = createComponent(selectedComponentType, componentValue);
			component.x = Math.round(x / 500) * 500; // グリッドスナップ（500px間隔）
			component.y = Math.round(y / 500) * 500;

			const id = `${selectedComponentType}_${Date.now()}_${componentCounter}`;

			// 部品を回路図に追加
			circuitDiagram.addComponent(component, id).then(() => {
				setComponentCounter(prev => prev + 1);
			});

			setStatusMessage(`${selectedComponentType}を配置しました (${component.x}, ${component.y}) - サイズ: ${component.width}x${component.height}`);
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
	}, [circuitDiagram, selectedTool, selectedComponentType, componentValue, createComponent, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight]);

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
	}, [circuitDiagram, componentLibrary]);	// マウスホイールズーム機能（パッシブイベント対応修正版）
	const handleCanvasWheel = useCallback((event: React.WheelEvent<SVGSVGElement>) => {
		// ⚠️ preventDefault修正: passtiveイベントリスナー対応
		// event.preventDefault(); // この行を削除
		event.stopPropagation();

		if (!svgRef.current) return;

		// SVG要素の境界を取得
		const rect = svgRef.current.getBoundingClientRect();

		// マウスの画面座標を取得
		const clientX = event.clientX - rect.left;
		const clientY = event.clientY - rect.top;

		// viewBox座標系でのマウス位置を計算
		const svgX = viewBoxX + (clientX / rect.width) * viewBoxWidth;
		const svgY = viewBoxY + (clientY / rect.height) * viewBoxHeight;

		// 視覚的フィードバック用にマウス位置を記録
		setMousePosition({ x: svgX, y: svgY });
		setShowZoomIndicator(true);

		const zoomSpeed = 0.1;
		const delta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;
		const newZoom = Math.max(0.5, Math.min(3, zoom + delta));

		// ズーム比率を計算
		const zoomRatio = newZoom / zoom;

		// マウス位置を中心としたviewBoxの調整
		const mouseRatioX = clientX / rect.width;
		const mouseRatioY = clientY / rect.height;

		const newViewBoxWidth = viewBoxWidth / zoomRatio;
		const newViewBoxHeight = viewBoxHeight / zoomRatio;

		const newViewBoxX = svgX - mouseRatioX * newViewBoxWidth;
		const newViewBoxY = svgY - mouseRatioY * newViewBoxHeight;

		setZoom(newZoom);
		setViewBoxX(newViewBoxX);
		setViewBoxY(newViewBoxY);
		setViewBoxWidth(newViewBoxWidth);
		setViewBoxHeight(newViewBoxHeight);

		setStatusMessage(`🔍 マウス位置中心ズーム: ${Math.round(newZoom * 100)}% (${Math.round(svgX)}, ${Math.round(svgY)})`);

		// 視覚効果を一定時間後に非表示
		setTimeout(() => {
			setShowZoomIndicator(false);
		}, 1000);
	}, [zoom, viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight]);	// マウス移動トラッキング（viewBox専用）
	const handleCanvasMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
		if (!svgRef.current) return;

		const rect = svgRef.current.getBoundingClientRect();

		// クライアント座標を取得
		const clientX = event.clientX - rect.left;
		const clientY = event.clientY - rect.top;

		// viewBox座標系に変換
		const svgX = viewBoxX + (clientX / rect.width) * viewBoxWidth;
		const svgY = viewBoxY + (clientY / rect.height) * viewBoxHeight;

		setMousePosition({ x: svgX, y: svgY });
	}, [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight]);

	// サイドパレット用ホイールイベント（通常のスクロール許可）
	const handleSidebarWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
		// サイドバー内では通常のスクロールを許可
		event.stopPropagation();
	}, []);
	// ページ全体のスクロール無効化
	useEffect(() => {
		// bodyとhtmlのスクロールを無効化
		const originalBodyStyle = document.body.style.overflow;
		const originalHtmlStyle = document.documentElement.style.overflow;

		document.body.style.overflow = 'hidden';
		document.documentElement.style.overflow = 'hidden';

		const preventPageScroll = (event: WheelEvent) => {
			// サイドバーエリア内でのスクロールを許可
			const target = event.target as Element;
			const isInSidebar = target.closest('.sidebar-scroll-area');

			if (!isInSidebar) {
				event.preventDefault();
			}
		};

		// ページ全体にイベントリスナーを追加
		document.addEventListener('wheel', preventPageScroll, { passive: false });

		return () => {
			// クリーンアップ時に元の設定を復元
			document.body.style.overflow = originalBodyStyle;
			document.documentElement.style.overflow = originalHtmlStyle;
			document.removeEventListener('wheel', preventPageScroll);
		};
	}, []);

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
			</header>			<div className="flex-1 flex overflow-hidden">
				{/* 左サイドバー - ツールパレット */}
				<div
					className="w-80 bg-white border-r border-gray-200 flex flex-col sidebar-scroll-area"
					onWheel={handleSidebarWheel}
				>
					{/* スクロール可能なコンテンツエリア */}
					<div className="flex-1 overflow-y-auto">
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
						</div>						{/* キャンバス制御 */}
						<div className="p-4">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 表示制御</h3>
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
									<div className="text-xs text-gray-500 mt-1">
										💡 キャンバス上でマウスホイールズーム可能
									</div>
								</div>
								<button
									onClick={() => {
										setZoom(1);
										setViewBoxX(-5000);
										setViewBoxY(-5000);
										setViewBoxWidth(10000);
										setViewBoxHeight(10000);
									}}
									className="w-full px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
								>
									🎯 表示リセット
								</button>
							</div>						</div>						{/* 設定とデバッグ */}
						<div className="p-4 border-t border-gray-200">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">⚙️ 設定</h3>
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										id="showCoords"
										defaultChecked={true}
										className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
									/>
									<label htmlFor="showCoords" className="text-sm font-medium text-gray-700">
										座標表示
									</label>
								</div>
								{/* デバッグ情報 */}
								<div className="mt-4 p-3 bg-gray-50 rounded-md">
									<h4 className="text-sm font-semibold text-gray-700 mb-2">🐛 デバッグ情報</h4>
									<div className="text-xs text-gray-600 space-y-1">
										<div>グリッド間隔: 500px</div>
										<div>ズーム: {Math.round(zoom * 100)}%</div>
										<div>ViewBox: {Math.round(viewBoxWidth)}x{Math.round(viewBoxHeight)}</div>
										<div>部品数: {circuitDiagram?.components.length || 0}</div>
										<div className="text-blue-600">💡 F12でコンソールログ確認</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* メインキャンバス */}
				<div className="flex-1 flex flex-col">					{/* ステータスバー */}
					<div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
						<div className="flex items-center justify-between text-sm">
							<div className="flex items-center gap-4">
								<span className="text-gray-600">
									ツール: <span className="font-medium">{selectedTool}</span>
									{selectedTool === 'place' && (
										<span> | 部品: <span className="font-medium">{selectedComponentType}</span></span>
									)}
								</span>
								{mousePosition && (
									<span className="text-gray-500 text-xs">
										📍 ({Math.round(mousePosition.x)}, {Math.round(mousePosition.y)})
									</span>
								)}
							</div>
							<span className="text-blue-600 font-medium">{statusMessage}</span>
						</div>
					</div>					{/* SVGキャンバス */}
					<div className="flex-1 overflow-hidden bg-white relative">					<svg
						ref={svgRef}
						className="w-full h-full cursor-crosshair"
						style={{ touchAction: 'none' }}
						onClick={handleCanvasClick}
						viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
						onWheel={handleCanvasWheel}
						onMouseMove={handleCanvasMouseMove}>
						{/* 白い背景 */}
						<rect
							x="-50000"
							y="-50000"
							width="100000"
							height="100000"
							fill="white"
						/>						{/* グリッド背景 - デフォルトで表示 */}						<defs>
							<pattern
								id="grid"
								width="500"
								height="500"
								patternUnits="userSpaceOnUse"
							>
								<path
									d="M 500 0 L 0 0 0 500"
									fill="none"
									stroke="#6b7280"
									strokeWidth="2"
								/>
								<circle
									cx="0"
									cy="0"
									r="3"
									fill="#4b5563"
								/>
							</pattern>
						</defs>

						<rect
							x="-50000"
							y="-50000"
							width="100000"
							height="100000"
							fill="url(#grid)"
						/>

						{/* 透明な背景レイヤー（マウスイベント確保用） */}
						<rect
							x="-50000"
							y="-50000"
							width="100000"
							height="100000"
							fill="transparent"
							style={{ pointerEvents: 'all' }}
						/>
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
						{/* ズーム視覚効果とマウス位置インジケーター */}
						{mousePosition && showZoomIndicator && (
							<g>
								{/* ズーム中心点の十字線 */}
								<g opacity="0.8">
									<line
										x1={mousePosition.x - 20}
										y1={mousePosition.y}
										x2={mousePosition.x + 20}
										y2={mousePosition.y}
										stroke="#ff6b35"
										strokeWidth="2"
										strokeLinecap="round"
									/>
									<line
										x1={mousePosition.x}
										y1={mousePosition.y - 20}
										x2={mousePosition.x}
										y2={mousePosition.y + 20}
										stroke="#ff6b35"
										strokeWidth="2"
										strokeLinecap="round"
									/>
								</g>
								{/* ズーム中心の円 */}
								<circle
									cx={mousePosition.x}
									cy={mousePosition.y}
									r="40"
									fill="none"
									stroke="#ff6b35"
									strokeWidth="2"
									strokeDasharray="10,5"
								>
									<animate
										attributeName="r"
										values="20;60;20"
										dur="1s"
										repeatCount="1"
									/>
									<animate
										attributeName="opacity"
										values="1;0.3;0"
										dur="1s"
										repeatCount="1"
									/>
								</circle>
								{/* ズーム中心点 */}
								<circle
									cx={mousePosition.x}
									cy={mousePosition.y}
									r="3"
									fill="#ff6b35"
								/>
							</g>
						)}
					</svg>
					</div>
				</div>				{/* 右サイドバー - ライブラリ */}
				<div
					className="w-64 bg-white border-l border-gray-200 sidebar-scroll-area"
					onWheel={handleSidebarWheel}
				>
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
