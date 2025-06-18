import React, { useState } from 'react'
import AdvancedTSXTest from './AdvancedTSXTest'

interface TestComponentProps {
  title: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ title }) => {
  const [count, setCount] = useState<number>(0);
  const [message, setMessage] = useState<string>('TSX is working!');

  const handleClick = (): void => {
    setCount(prevCount => prevCount + 1);
    setMessage(`ボタンが ${count + 1} 回クリックされました！`);
  };

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f8ff',
      borderRadius: '10px',
      margin: '20px'
    }}>
      <h1 style={{ color: '#333' }}>{title}</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>{message}</p>
      <button 
        onClick={handleClick}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          transition: 'background-color 0.3s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#005a9e'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007acc'}
      >
        クリック回数: {count}
      </button>
    </div>
  );
};

function App(): JSX.Element {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const toggleDarkMode = (): void => {
    setDarkMode(!darkMode);
  };

  const toggleAdvanced = (): void => {
    setShowAdvanced(!showAdvanced);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
      color: darkMode ? '#ffffff' : '#000000',
      transition: 'all 0.3s ease'
    }}>
      <header style={{ 
        padding: '20px', 
        textAlign: 'center',
        borderBottom: `2px solid ${darkMode ? '#333' : '#ddd'}`
      }}>
        <h1>🧪 TSX環境テストプロジェト</h1>        <button 
          onClick={toggleDarkMode}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: darkMode ? '#444' : '#f0f0f0',
            color: darkMode ? '#fff' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {darkMode ? '☀️ ライトモード' : '🌙 ダークモード'}
        </button>
        <button 
          onClick={toggleAdvanced}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: showAdvanced ? '#dc3545' : '#007acc',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showAdvanced ? '📋 基本テスト' : '🔬 高度なテスト'}
        </button>
      </header>      <main style={{ padding: '20px' }}>
        {showAdvanced ? (
          <AdvancedTSXTest initialTheme={darkMode ? 'dark' : 'light'} />
        ) : (
          <>
            <TestComponent title="TypeScript + React (.tsx) テスト" />
            
            <div style={{ 
              textAlign: 'center', 
              marginTop: '30px',
              padding: '20px',
              backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9',
              borderRadius: '8px'
            }}>
              <h2>✅ 確認項目</h2>
              <ul style={{ 
                textAlign: 'left', 
                display: 'inline-block',
                listStyle: 'none',
                padding: 0
              }}>
                <li>✅ .tsx ファイルの読み込み</li>
                <li>✅ TypeScript の型定義</li>
                <li>✅ React Hooks (useState)</li>
                <li>✅ JSX の記述</li>
                <li>✅ インターフェース定義</li>
                <li>✅ イベントハンドラ</li>
                <li>✅ CSS-in-JS スタイリング</li>
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
