// TSXの高度な機能をテストするためのコンポーネント
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// 型定義のテスト
interface User {
  id: number;
  name: string;
  email: string;
}

type Theme = 'light' | 'dark';

interface AdvancedTestProps {
  initialTheme?: Theme;
  users?: User[];
}

// ジェネリック型のテスト
interface GenericData<T> {
  data: T;
  loading: boolean;
  error?: string;
}

// 高階コンポーネントのテスト
function withLoading<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { loading?: boolean }> {
  return ({ loading, ...props }) => {
    if (loading) {
      return <div>読み込み中...</div>;
    }
    return <Component {...(props as P)} />;
  };
}

// カスタムフックのテスト
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState<number>(initialValue);
  
  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);
  
  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);
  
  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);
  
  return { count, increment, decrement, reset };
}

// メインコンポーネント
const AdvancedTSXTest: React.FC<AdvancedTestProps> = ({ 
  initialTheme = 'light',
  users = []
}) => {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [userData, setUserData] = useState<GenericData<User[]>>({
    data: users,
    loading: false
  });
  
  const { count, increment, decrement, reset } = useCounter(0);
  
  // useEffectのテスト
  useEffect(() => {
    console.log('コンポーネントがマウントされました');
    return () => {
      console.log('コンポーネントがアンマウントされます');
    };
  }, []);
  
  // useMemoのテスト
  const computedValue = useMemo(() => {
    return count * 2 + userData.data.length;
  }, [count, userData.data.length]);
  
  // イベントハンドラのテスト
  const handleThemeToggle = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  const handleAddUser = useCallback(() => {
    const newUser: User = {
      id: Date.now(),
      name: `ユーザー ${userData.data.length + 1}`,
      email: `user${userData.data.length + 1}@example.com`
    };
    
    setUserData(prev => ({
      ...prev,
      data: [...prev.data, newUser]
    }));
  }, [userData.data.length]);
  
  // 条件レンダリングのテスト
  const renderUserList = (): JSX.Element | null => {
    if (userData.loading) {
      return <div>ユーザーデータを読み込み中...</div>;
    }
    
    if (userData.data.length === 0) {
      return <div>ユーザーがいません</div>;
    }
    
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {userData.data.map((user: User) => (
          <li 
            key={user.id}
            style={{
              padding: '8px',
              margin: '4px 0',
              backgroundColor: theme === 'dark' ? '#3a3a3a' : '#f0f0f0',
              borderRadius: '4px'
            }}
          >
            <strong>{user.name}</strong> - {user.email}
          </li>
        ))}
      </ul>
    );
  };
  
  const themeStyles = {
    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#000000',
    minHeight: '100vh',
    padding: '20px',
    transition: 'all 0.3s ease'
  };
  
  return (
    <div style={themeStyles}>
      <h1>🔬 高度なTSX機能テスト</h1>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>テーマ切り替え（型定義テスト）</h2>
        <button 
          onClick={handleThemeToggle}
          style={{
            padding: '10px 20px',
            backgroundColor: theme === 'dark' ? '#007acc' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? '☀️ ライトモード' : '🌙 ダークモード'}
        </button>
        <p>現在のテーマ: <code>{theme}</code></p>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>カスタムフックテスト</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={decrement}>➖</button>
          <span style={{ 
            padding: '10px 20px', 
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f9f9f9',
            borderRadius: '5px'
          }}>
            カウント: {count}
          </span>
          <button onClick={increment}>➕</button>
          <button onClick={reset} style={{ marginLeft: '10px' }}>🔄 リセット</button>
        </div>
        <p>計算値 (count * 2 + users.length): <strong>{computedValue}</strong></p>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>ジェネリック型とユーザー管理</h2>
        <button 
          onClick={handleAddUser}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '15px'
          }}
        >
          ➕ ユーザーを追加
        </button>
        <div>
          <h3>ユーザーリスト ({userData.data.length}人):</h3>
          {renderUserList()}
        </div>
      </section>
      
      <section>
        <h2>✅ テスト済み機能</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px'
        }}>
          {[
            'TypeScript型定義',
            'React Hooks (useState, useEffect, useCallback, useMemo)',
            'カスタムフック作成',
            'ジェネリック型',
            'インターフェースと型エイリアス',
            'イベントハンドラの型安全性',
            '条件レンダリング',
            'リストレンダリング',
            'CSS-in-JS',
            'コンポーネント間の型受け渡し'
          ].map((feature, index) => (
            <div 
              key={index}
              style={{
                padding: '15px',
                backgroundColor: theme === 'dark' ? '#3a3a3a' : '#e8f5e8',
                borderRadius: '8px',
                border: `2px solid ${theme === 'dark' ? '#4a4a4a' : '#d4edda'}`
              }}
            >
              ✅ {feature}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// HOCのテスト
const AdvancedTSXTestWithLoading = withLoading(AdvancedTSXTest);

export default AdvancedTSXTestWithLoading;
