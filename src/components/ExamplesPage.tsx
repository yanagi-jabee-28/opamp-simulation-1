import { useRef, useEffect } from 'react';
import {
	CircuitDiagram,
	ComponentLibrary,
	Resistor,
	Inductor,
	Capacitor,
	CMOSN,
	CMOSP
} from '../lib/circuit-components';

const ExamplesPage: React.FC = () => {
	const basicExampleRef = useRef<SVGSVGElement>(null);
	const rotatedExampleRef = useRef<SVGSVGElement>(null);
	const rlcExampleRef = useRef<SVGSVGElement>(null);
	const mosExampleRef = useRef<SVGSVGElement>(null);
	const dynamicExampleRef = useRef<SVGSVGElement>(null);

	const createBasicExample = () => {
		if (!basicExampleRef.current) return;

		basicExampleRef.current.innerHTML = '';
		const circuit = new CircuitDiagram(basicExampleRef.current);

		const resistor = new Resistor(100, 100, 0, "1kΩ");
		circuit.addComponent(resistor, "R1");

		const inductor = new Inductor(300, 100, 0, "10mH");
		circuit.addComponent(inductor, "L1");

		const capacitor = new Capacitor(500, 100, 0, "100μF");
		circuit.addComponent(capacitor, "C1");
	};

	const createRotatedExample = () => {
		if (!rotatedExampleRef.current) return;

		rotatedExampleRef.current.innerHTML = '';
		const circuit = new CircuitDiagram(rotatedExampleRef.current);

		const rotatedResistor = new Resistor(100, 150, 90, "2.2kΩ");
		circuit.addComponent(rotatedResistor, "R_rot");

		const rotatedInductor = new Inductor(200, 150, 90, "47μH");
		circuit.addComponent(rotatedInductor, "L_rot");

		const rotatedCapacitor = new Capacitor(300, 150, 90, "220μF");
		circuit.addComponent(rotatedCapacitor, "C_rot");
	};

	const createRLCExample = () => {
		if (!rlcExampleRef.current) return;

		rlcExampleRef.current.innerHTML = '';
		const circuit = new CircuitDiagram(rlcExampleRef.current);

		const R = new Resistor(100, 100, 0, "1kΩ");
		circuit.addComponent(R, "R1");

		const L = new Inductor(350, 100, 0, "10mH");
		circuit.addComponent(L, "L1");

		const C = new Capacitor(600, 100, 0, "100nF");
		circuit.addComponent(C, "C1");

		// 接続線を追加
		circuit.addWire(280, 100, 350, 100);
		circuit.addWire(630, 100, 700, 100);
		circuit.addWire(100, 200, 700, 200);
		circuit.addWire(100, 100, 100, 200);
		circuit.addWire(700, 100, 700, 200);
	};

	const createDynamicCircuit = () => {
		if (!dynamicExampleRef.current) return;

		dynamicExampleRef.current.innerHTML = '';
		const circuit = new CircuitDiagram(dynamicExampleRef.current);

		const components = ['Resistor', 'Inductor', 'Capacitor'] as const;
		const values = ['100Ω', '1kΩ', '10kΩ', '1mH', '10mH', '100μF', '1μF'];

		for (let i = 0; i < 6; i++) {
			const x = 50 + (i % 3) * 250;
			const y = 80 + Math.floor(i / 3) * 120;
			const rotation = Math.random() > 0.5 ? 0 : 90;
			const compType = components[Math.floor(Math.random() * components.length)];
			const value = values[Math.floor(Math.random() * values.length)];

			let component;
			switch (compType) {
				case 'Resistor':
					component = new Resistor(x, y, rotation, value);
					break;
				case 'Inductor':
					component = new Inductor(x, y, rotation, value);
					break;
				case 'Capacitor':
					component = new Capacitor(x, y, rotation, value);
					break;
			}

			circuit.addComponent(component, `comp_${i}`);
		}
	};

	const demonstrateLibrary = () => {
		const library = new ComponentLibrary();

		const myResistor = new Resistor(0, 0, 0, "10kΩ");
		library.saveComponent("標準抵抗", myResistor);

		const myInductor = new Inductor(0, 0, 0, "1mH");
		library.saveComponent("標準インダクタ", myInductor);

		return library.exportComponents();
	};

	const createMOSExample = () => {
		if (!mosExampleRef.current) return;

		mosExampleRef.current.innerHTML = '';
		const circuit = new CircuitDiagram(mosExampleRef.current);

		// NMOS トランジスタ
		const nmos = new CMOSN(150, 100, 0, "M1_N");
		circuit.addComponent(nmos, "M1");

		// PMOS トランジスタ
		const pmos = new CMOSP(400, 100, 0, "M2_P");
		circuit.addComponent(pmos, "M2");

		// CMOS インバータの例（垂直配置）
		const nmosInv = new CMOSN(600, 150, 0, "M3_N");
		circuit.addComponent(nmosInv, "M3");

		const pmosInv = new CMOSP(600, 50, 0, "M4_P");
		circuit.addComponent(pmosInv, "M4");

		// インバータ回路の接続線
		circuit.addWire(570, 50, 570, 150); // 入力ゲート接続
		circuit.addWire(600, 35, 600, 20);  // VDD
		circuit.addWire(600, 165, 600, 180); // VSS
		circuit.addWire(630, 100, 680, 100); // 出力
	};
	useEffect(() => {
		createBasicExample();
		createMOSExample();
	}, []);

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4">
				<h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
					電子回路部品ライブラリ 使用例
				</h1>

				<div className="space-y-8">
					{/* 基本的な使用方法 */}
					<div className="bg-white rounded-xl shadow-lg p-8">
						<h2 className="text-2xl font-bold text-gray-800 mb-4">基本的な使用方法</h2>
						<p className="text-gray-600 mb-4">以下のコードで簡単に回路部品を作成できます：</p>

						<pre className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto text-sm">
							<code>{`// SVGキャンバスの準備
const svg = document.getElementById('mySvg');
const circuit = new CircuitDiagram(svg);

// 抵抗器を追加 (x=100, y=100, 回転=0度, 値="1kΩ")
const resistor = new Resistor(100, 100, 0, "1kΩ");
circuit.addComponent(resistor, "R1");

// インダクタを追加
const inductor = new Inductor(300, 100, 0, "10mH");
circuit.addComponent(inductor, "L1");

// コンデンサを追加
const capacitor = new Capacitor(500, 100, 0, "100μF");
circuit.addComponent(capacitor, "C1");`}</code>
						</pre>

						<button
							onClick={createBasicExample}
							className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
						>
							実行
						</button>
						<svg
							ref={basicExampleRef}
							className="w-full border-2 border-gray-200 rounded-lg bg-white"
							width="700"
							height="200"
							viewBox="0 0 700 200"
						/>
					</div>

					{/* 回転した部品の例 */}
					<div className="bg-white rounded-xl shadow-lg p-8">
						<h2 className="text-2xl font-bold text-gray-800 mb-4">回転した部品の例</h2>
						<p className="text-gray-600 mb-4">部品を回転させることもできます：</p>

						<pre className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto text-sm">
							<code>{`// 90度回転した部品を作成
const rotatedResistor = new Resistor(100, 150, 90, "2.2kΩ");
const rotatedInductor = new Inductor(200, 150, 90, "47μH");
const rotatedCapacitor = new Capacitor(300, 150, 90, "220μF");`}</code>
						</pre>

						<button
							onClick={createRotatedExample}
							className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
						>
							実行
						</button>
						<svg
							ref={rotatedExampleRef}
							className="w-full border-2 border-gray-200 rounded-lg bg-white"
							width="500"
							height="300"
							viewBox="0 0 500 300"
						/>
					</div>

					{/* RLC直列回路の例 */}
					<div className="bg-white rounded-xl shadow-lg p-8">
						<h2 className="text-2xl font-bold text-gray-800 mb-4">RLC直列回路の例</h2>
						<p className="text-gray-600 mb-4">複数の部品を組み合わせて回路を作成：</p>

						<pre className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto text-sm">
							<code>{`// RLC直列回路
const circuit = new CircuitDiagram(svg);

// 部品を配置
const R = new Resistor(100, 100, 0, "1kΩ");
const L = new Inductor(350, 100, 0, "10mH");
const C = new Capacitor(600, 100, 0, "100nF");

// 接続線を追加
circuit.addWire(280, 100, 350, 100);
circuit.addWire(630, 100, 700, 100);`}</code>
						</pre>

						<button
							onClick={createRLCExample}
							className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
						>
							実行
						</button>
						<svg
							ref={rlcExampleRef}
							className="w-full border-2 border-gray-200 rounded-lg bg-white"
							width="800"
							height="250"
							viewBox="0 0 800 250"
						/>
					</div>

					{/* 部品ライブラリの保存・読み込み */}
					<div className="bg-white rounded-xl shadow-lg p-8">
						<h2 className="text-2xl font-bold text-gray-800 mb-4">部品ライブラリの保存・読み込み</h2>
						<p className="text-gray-600 mb-4">部品の設定を保存して再利用できます：</p>

						<pre className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto text-sm">
							<code>{`// ライブラリを作成
const library = new ComponentLibrary();

// 部品を保存
const myResistor = new Resistor(0, 0, 0, "10kΩ");
library.saveComponent("標準抵抗", myResistor);

// 保存した部品を読み込み
const loadedComponent = library.loadComponent("標準抵抗");`}</code>
						</pre>

						<button
							onClick={() => {
								const data = demonstrateLibrary();
								alert(`ライブラリデータ:\n${data}`);
							}}
							className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
						>
							ライブラリデモ
						</button>
					</div>

					{/* MOSトランジスタの例 */}
					<div className="bg-white rounded-xl shadow-lg p-8">
						<h2 className="text-2xl font-bold text-gray-800 mb-4">MOSトランジスタ</h2>
						<p className="text-gray-600 mb-4">NMOS・PMOSトランジスタとCMOSインバータ回路：</p>

						<pre className="bg-gray-100 p-4 rounded-lg text-sm mb-4 overflow-x-auto">
							<code>{`// NMOS・PMOSトランジスタの配置
const nmos = new CMOSN(150, 100, 0, "M1_N");
const pmos = new CMOSP(400, 100, 0, "M2_P");

// CMOSインバータ回路
const nmosInv = new CMOSN(600, 150, 0, "M3_N");
const pmosInv = new CMOSP(600, 50, 0, "M4_P");

// 端子：ゲート(G)、ドレイン(D)、ソース(S)、バルク(B)`}</code>
						</pre>

						<button
							onClick={createMOSExample}
							className="mb-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
						>
							実行
						</button>
						<svg
							ref={mosExampleRef}
							className="w-full border-2 border-gray-200 rounded-lg bg-white"
							width="800"
							height="200"
							viewBox="0 0 800 200"
						/>
					</div>

					{/* 動的な回路作成 */}
					<div className="bg-white rounded-xl shadow-lg p-8">
						<h2 className="text-2xl font-bold text-gray-800 mb-4">動的な回路作成</h2>
						<p className="text-gray-600 mb-4">プログラムで動的に回路を生成：</p>

						<button
							onClick={createDynamicCircuit}
							className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
						>
							ランダム回路生成
						</button>
						<svg
							ref={dynamicExampleRef}
							className="w-full border-2 border-gray-200 rounded-lg bg-white"
							width="800"
							height="300"
							viewBox="0 0 800 300"
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ExamplesPage;
