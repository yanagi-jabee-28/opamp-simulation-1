import { useState } from 'react';
import ComponentLibraryApp from './components/ComponentLibraryApp';
import ExamplesPage from './components/ExamplesPage';
import './index.css';

type PageType = 'library' | 'examples';

function App() {
	const [currentPage, setCurrentPage] = useState<PageType>('library');

	return (
		<div className="App">
			{/* ナビゲーション */}
			<nav className="bg-gray-800 text-white p-4 shadow-lg">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<h1 className="text-2xl font-bold">電子回路部品ライブラリ (TypeScript版)</h1>
					<div className="flex space-x-4">
						<button
							onClick={() => setCurrentPage('library')}
							className={`px-4 py-2 rounded-lg transition-colors ${currentPage === 'library'
								? 'bg-blue-600 text-white'
								: 'bg-gray-600 text-gray-200 hover:bg-gray-500'
								}`}
						>
							部品ライブラリ
						</button>
						<button
							onClick={() => setCurrentPage('examples')}
							className={`px-4 py-2 rounded-lg transition-colors ${currentPage === 'examples'
								? 'bg-blue-600 text-white'
								: 'bg-gray-600 text-gray-200 hover:bg-gray-500'
								}`}
						>
							使用例
						</button>
					</div>
				</div>
			</nav>

			{/* ページコンテンツ */}
			<main>
				{currentPage === 'library' && <ComponentLibraryApp />}
				{currentPage === 'examples' && <ExamplesPage />}
			</main>

			{/* フッター */}
			<footer className="bg-gray-800 text-white p-6 mt-8">
				<div className="max-w-7xl mx-auto text-center">
					<p className="text-gray-400">
						TypeScript + React で構築された再利用可能な電子回路部品ライブラリ
					</p>
					<p className="text-sm text-gray-500 mt-2">
						型安全性、再利用性、保守性を重視した設計
					</p>
				</div>
			</footer>
		</div>
	);
}

export default App;
