import { useRef, useEffect, useState, useCallback } from 'react';
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

interface ComponentLibraryAppProps {
	className?: string;
}

type ComponentType = 'resistor' | 'inductor' | 'capacitor' | 'cmosn' | 'cmosp';

const ComponentLibraryApp: React.FC<ComponentLibraryAppProps> = ({ className = '' }) => {
	const svgRef = useRef<SVGSVGElement>(null);
	const [circuitDiagram, setCircuitDiagram] = useState<CircuitDiagram | null>(null);
	const [componentLibrary, setComponentLibrary] = useState<ComponentLibrary | null>(null);
	const [selectedComponentType, setSelectedComponentType] = useState<ComponentType>('resistor');
	const [componentValue, setComponentValue] = useState<string>('');
	const [rotation, setRotation] = useState<number>(0);
	const [statusMessage, setStatusMessage] = useState<string>('初期化完了。クリックして部品を配置してください。');
	const [libraryItems, setLibraryItems] = useState<Record<string, ComponentData>>({});
	const [showExportModal, setShowExportModal] = useState<boolean>(false);
	const [showImportModal, setShowImportModal] = useState<boolean>(false);
	const [exportData, setExportData] = useState<string>('');
	const [importData, setImportData] = useState<string>('');
	const [componentCounter, setComponentCounter] = useState<number>(0);

	// 初期化
	useEffect(() => {
		if (svgRef.current) {
			const diagram = new CircuitDiagram(svgRef.current);
			const library = new ComponentLibrary();

			setCircuitDiagram(diagram);
			setComponentLibrary(library);
			setLibraryItems(library.components);
		}
	}, []);

	// ライブラリアイテムの更新
	const updateLibraryItems = useCallback(() => {
		if (componentLibrary) {
			setLibraryItems(componentLibrary.components);
		}
	}, [componentLibrary]);

	// SVGクリックハンドラー
	const handleSvgClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
		if (!circuitDiagram || !svgRef.current) return;

		const rect = svgRef.current.getBoundingClientRect();
		const x = (event.clientX - rect.left) * (1200 / rect.width);
		const y = (event.clientY - rect.top) * (400 / rect.height);

		const value = componentValue || getDefaultValue(selectedComponentType);
		let component: CircuitComponent;
		switch (selectedComponentType) {
			case 'resistor':
				component = new Resistor(x, y, rotation, value);
				break;
			case 'inductor':
				component = new Inductor(x, y, rotation, value);
				break;
			case 'capacitor':
				component = new Capacitor(x, y, rotation, value);
				break;
			case 'cmosn':
				component = new CMOSN(x, y, rotation, value);
				break;
			case 'cmosp':
				component = new CMOSP(x, y, rotation, value);
				break;
			default:
				return;
		}

		const id = `comp_${componentCounter + 1}`;
		setComponentCounter(prev => prev + 1);
		circuitDiagram.addComponent(component, id);
		setStatusMessage(`${selectedComponentType}を追加しました (${value}) at (${Math.round(x)}, ${Math.round(y)})`);
	}, [circuitDiagram, selectedComponentType, componentValue, rotation, componentCounter]);
	// デフォルト値を取得
	const getDefaultValue = (type: ComponentType): string => {
		switch (type) {
			case 'resistor': return 'R';
			case 'inductor': return 'L';
			case 'capacitor': return 'C';
			case 'cmosn': return 'M_N';
			case 'cmosp': return 'M_P';
			default: return '';
		}
	};
	// プレースホルダーを取得
	const getPlaceholder = (type: ComponentType): string => {
		switch (type) {
			case 'resistor': return '例: 100Ω';
			case 'inductor': return '例: 10mH';
			case 'capacitor': return '例: 100μF';
			case 'cmosn': return '例: M1_N';
			case 'cmosp': return '例: M1_P';
			default: return '';
		}
	};

	// コンポーネントタイプ変更
	const handleComponentTypeChange = (type: ComponentType) => {
		setSelectedComponentType(type);
		setComponentValue('');
		setStatusMessage(`${type}モードに切り替えました。クリックして配置してください。`);
	};

	// キャンバスクリア
	const clearCanvas = () => {
		if (circuitDiagram) {
			circuitDiagram.clear();
			setStatusMessage('キャンバスをクリアしました。');
		}
	};

	// 部品保存
	const saveCurrentComponent = () => {
		const name = prompt('部品に名前を付けてください:');
		if (!name || !componentLibrary) return;

		const value = componentValue || getDefaultValue(selectedComponentType);
		let component: CircuitComponent;

		switch (selectedComponentType) {
			case 'resistor':
				component = new Resistor(0, 0, rotation, value);
				break;
			case 'inductor':
				component = new Inductor(0, 0, rotation, value);
				break;
			case 'capacitor':
				component = new Capacitor(0, 0, rotation, value);
				break;
			default:
				return;
		}

		componentLibrary.saveComponent(name, component);
		updateLibraryItems();
		setStatusMessage(`部品 "${name}" を保存しました。`);
	};

	// ライブラリから読み込み
	const loadComponentFromLibrary = (name: string) => {
		if (!componentLibrary || !circuitDiagram) return;

		const component = componentLibrary.loadComponent(name);
		if (component) {
			component.x = 100;
			component.y = 200;
			const id = `comp_${componentCounter + 1}`;
			setComponentCounter(prev => prev + 1);
			circuitDiagram.addComponent(component, id);
			setStatusMessage(`ライブラリから "${name}" を読み込みました。`);
		}
	};

	// ライブラリから削除
	const deleteFromLibrary = (name: string) => {
		if (!componentLibrary) return;

		if (window.confirm(`"${name}" を削除しますか？`)) {
			componentLibrary.deleteComponent(name);
			updateLibraryItems();
			setStatusMessage(`部品 "${name}" を削除しました。`);
		}
	};

	// エクスポート
	const handleExport = () => {
		if (componentLibrary) {
			setExportData(componentLibrary.exportComponents());
			setShowExportModal(true);
		}
	};

	// インポート
	const handleImport = () => {
		if (!componentLibrary || !importData) return;

		if (componentLibrary.importComponents(importData)) {
			updateLibraryItems();
			setShowImportModal(false);
			setImportData('');
			setStatusMessage('ライブラリのインポートが完了しました。');
		} else {
			alert('インポートに失敗しました。JSONデータを確認してください。');
		}
	};

	// エクスポートデータコピー
	const copyExportData = async () => {
		try {
			await navigator.clipboard.writeText(exportData);
			setStatusMessage('エクスポートデータをクリップボードにコピーしました。');
		} catch (err) {
			console.error('Failed to copy: ', err);
		}
	};

	return (
		<div className={`min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 p-5 ${className}`}>
			<div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl p-10">
				<h1 className="text-4xl font-bold text-center text-gray-800 mb-8 drop-shadow-lg">
					再利用可能な電子回路部品ライブラリ
				</h1>

				{/* ツールバー */}
				<div className="bg-gray-50 rounded-2xl p-6 mb-8 shadow-inner">
					<div className="flex flex-wrap gap-4 items-center justify-between">
						<div className="flex flex-wrap gap-3 items-center">
							<button
								onClick={() => handleComponentTypeChange('resistor')}
								className={`px-4 py-2 rounded-full font-medium transition-all ${selectedComponentType === 'resistor'
									? 'bg-blue-500 text-white shadow-lg'
									: 'bg-white text-gray-700 hover:bg-blue-50'
									}`}
							>
								抵抗器追加
							</button>
							<button
								onClick={() => handleComponentTypeChange('inductor')}
								className={`px-4 py-2 rounded-full font-medium transition-all ${selectedComponentType === 'inductor'
									? 'bg-blue-500 text-white shadow-lg'
									: 'bg-white text-gray-700 hover:bg-blue-50'
									}`}
							>
								インダクタ追加
							</button>							<button
								onClick={() => handleComponentTypeChange('capacitor')}
								className={`px-4 py-2 rounded-full font-medium transition-all ${selectedComponentType === 'capacitor'
									? 'bg-blue-500 text-white shadow-lg'
									: 'bg-white text-gray-700 hover:bg-blue-50'
									}`}
							>
								コンデンサ追加
							</button>
							<button
								onClick={() => handleComponentTypeChange('cmosn')}
								className={`px-4 py-2 rounded-full font-medium transition-all ${selectedComponentType === 'cmosn'
									? 'bg-green-500 text-white shadow-lg'
									: 'bg-white text-gray-700 hover:bg-green-50'
									}`}
							>
								NMOS追加
							</button>
							<button
								onClick={() => handleComponentTypeChange('cmosp')}
								className={`px-4 py-2 rounded-full font-medium transition-all ${selectedComponentType === 'cmosp'
									? 'bg-purple-500 text-white shadow-lg'
									: 'bg-white text-gray-700 hover:bg-purple-50'
									}`}
							>
								PMOS追加
							</button>

							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-gray-700">値:</label>
								<input
									type="text"
									value={componentValue}
									onChange={(e) => setComponentValue(e.target.value)}
									placeholder={getPlaceholder(selectedComponentType)}
									className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-gray-700">回転:</label>
								<select
									value={rotation}
									onChange={(e) => setRotation(Number(e.target.value))}
									className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value={0}>0°</option>
									<option value={90}>90°</option>
									<option value={180}>180°</option>
									<option value={270}>270°</option>
								</select>
							</div>
						</div>

						<div className="flex gap-2">
							<button
								onClick={clearCanvas}
								className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all"
							>
								クリア
							</button>
							<button
								onClick={saveCurrentComponent}
								className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all"
							>
								部品保存
							</button>
							<button
								onClick={handleExport}
								className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all"
							>
								エクスポート
							</button>
							<button
								onClick={() => setShowImportModal(true)}
								className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all"
							>
								インポート
							</button>
						</div>
					</div>
				</div>

				{/* キャンバス */}
				<div className="bg-white border-2 border-gray-200 rounded-2xl mb-8 overflow-hidden">
					<svg
						ref={svgRef}
						width="100%"
						height="400"
						viewBox="0 0 1200 400"
						className="cursor-crosshair"
						onClick={handleSvgClick}
					>
						<defs>
							<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
								<path d="M 20 0 L 0 0 0 20" fill="none" stroke="#eee" strokeWidth="1" />
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill="url(#grid)" />
					</svg>
				</div>

				{/* ライブラリパネル */}
				<div className="bg-gray-50 rounded-2xl p-6 shadow-inner">
					<h2 className="text-2xl font-bold text-gray-800 mb-5">保存された部品ライブラリ</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{Object.keys(libraryItems).length === 0 ? (
							<div className="col-span-full text-center text-gray-500 py-8">
								保存された部品がありません
							</div>
						) : (
							Object.entries(libraryItems).map(([name, data]) => (
								<div key={name} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
									<div className="font-bold text-gray-800 mb-1">{name}</div>
									<div className="text-sm text-gray-600 mb-3">
										{data.type} ({data.value || '値なし'})
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => loadComponentFromLibrary(name)}
											className="flex-1 px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
										>
											読み込み
										</button>
										<button
											onClick={() => deleteFromLibrary(name)}
											className="flex-1 px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
										>
											削除
										</button>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* ステータスバー */}
				<div className="mt-6 bg-gray-800 text-white p-4 rounded-xl font-mono text-sm">
					{statusMessage}
				</div>
			</div>

			{/* エクスポートモーダル */}
			{showExportModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
						<h3 className="text-2xl font-bold text-gray-800 mb-4">部品ライブラリのエクスポート</h3>
						<p className="text-gray-600 mb-4">以下のJSONデータをコピーして保存してください：</p>
						<textarea
							value={exportData}
							readOnly
							className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none"
						/>
						<div className="flex justify-end gap-3 mt-4">
							<button
								onClick={() => setShowExportModal(false)}
								className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
							>
								閉じる
							</button>
							<button
								onClick={copyExportData}
								className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
							>
								コピー
							</button>
						</div>
					</div>
				</div>
			)}

			{/* インポートモーダル */}
			{showImportModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
						<h3 className="text-2xl font-bold text-gray-800 mb-4">部品ライブラリのインポート</h3>
						<p className="text-gray-600 mb-4">JSONデータを貼り付けてください：</p>
						<textarea
							value={importData}
							onChange={(e) => setImportData(e.target.value)}
							placeholder="JSONデータをここに貼り付け..."
							className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none"
						/>
						<div className="flex justify-end gap-3 mt-4">
							<button
								onClick={() => setShowImportModal(false)}
								className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
							>
								キャンセル
							</button>
							<button
								onClick={handleImport}
								className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
							>
								インポート
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ComponentLibraryApp;
