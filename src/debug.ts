/**
 * デバッグユーティリティ
 * 開発時のデバッグを管理するための統一されたシステム
 */

// デバッグレベルの定義
export enum DebugLevel {
	OFF = 0,      // デバッグ出力なし
	ERROR = 1,    // エラーのみ
	WARN = 2,     // 警告以上
	INFO = 3,     // 情報以上
	DEBUG = 4,    // デバッグ情報以上
	TRACE = 5     // すべて
}

// デバッグカテゴリの定義
export enum DebugCategory {
	COMPONENT = 'COMPONENT',
	CANVAS = 'CANVAS',
	EVENTS = 'EVENTS',
	SVG = 'SVG',
	POSITIONING = 'POSITIONING',
	UI = 'UI'
}

// デバッグ設定
interface DebugConfig {
	enabled: boolean;
	level: DebugLevel;
	categories: Set<DebugCategory>;
	timestamp: boolean;
	prefix: boolean;
}

class DebugManager {
	private config: DebugConfig = {
		enabled: true, // 開発時はtrue、本番時はfalse
		level: DebugLevel.DEBUG,
		categories: new Set([
			DebugCategory.COMPONENT,
			DebugCategory.CANVAS,
			DebugCategory.EVENTS,
			DebugCategory.SVG,
			DebugCategory.POSITIONING,
			DebugCategory.UI
		]),
		timestamp: true,
		prefix: true
	};

	/**
	 * デバッグ設定を更新
	 */
	public configure(config: Partial<DebugConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * デバッグを有効/無効にする
	 */
	public setEnabled(enabled: boolean): void {
		this.config.enabled = enabled;
	}

	/**
	 * デバッグレベルを設定
	 */
	public setLevel(level: DebugLevel): void {
		this.config.level = level;
	}

	/**
	 * デバッグカテゴリを設定
	 */
	public setCategories(categories: DebugCategory[]): void {
		this.config.categories = new Set(categories);
	}

	/**
	 * 共通のログ出力関数
	 */
	private log(
		level: DebugLevel,
		category: DebugCategory,
		message: string,
		...args: any[]
	): void {
		// デバッグが無効の場合は何もしない
		if (!this.config.enabled) return;

		// レベルチェック
		if (level > this.config.level) return;

		// カテゴリチェック
		if (!this.config.categories.has(category)) return;

		// メッセージの構築
		let logMessage = '';

		if (this.config.timestamp) {
			logMessage += `[${new Date().toISOString()}] `;
		}

		if (this.config.prefix) {
			const levelName = DebugLevel[level];
			logMessage += `[${levelName}:${category}] `;
		}

		logMessage += message;

		// レベルに応じたコンソール出力
		switch (level) {
			case DebugLevel.ERROR:
				console.error(logMessage, ...args);
				break;
			case DebugLevel.WARN:
				console.warn(logMessage, ...args);
				break;
			case DebugLevel.INFO:
				console.info(logMessage, ...args);
				break;
			case DebugLevel.DEBUG:
			case DebugLevel.TRACE:
				console.log(logMessage, ...args);
				break;
		}
	}

	/**
	 * エラーログ
	 */
	public error(category: DebugCategory, message: string, ...args: any[]): void {
		this.log(DebugLevel.ERROR, category, message, ...args);
	}

	/**
	 * 警告ログ
	 */
	public warn(category: DebugCategory, message: string, ...args: any[]): void {
		this.log(DebugLevel.WARN, category, message, ...args);
	}

	/**
	 * 情報ログ
	 */
	public info(category: DebugCategory, message: string, ...args: any[]): void {
		this.log(DebugLevel.INFO, category, message, ...args);
	}

	/**
	 * デバッグログ
	 */
	public debug(category: DebugCategory, message: string, ...args: any[]): void {
		this.log(DebugLevel.DEBUG, category, message, ...args);
	}

	/**
	 * トレースログ
	 */
	public trace(category: DebugCategory, message: string, ...args: any[]): void {
		this.log(DebugLevel.TRACE, category, message, ...args);
	}

	/**
	 * メソッドの実行時間を測定
	 */
	public time<T>(
		category: DebugCategory,
		label: string,
		fn: () => T
	): T {
		if (!this.config.enabled || !this.config.categories.has(category)) {
			return fn();
		}

		const start = performance.now();
		const result = fn();
		const end = performance.now();

		this.debug(category, `${label} took ${(end - start).toFixed(2)}ms`);
		return result;
	}

	/**
	 * 非同期メソッドの実行時間を測定
	 */
	public async timeAsync<T>(
		category: DebugCategory,
		label: string,
		fn: () => Promise<T>
	): Promise<T> {
		if (!this.config.enabled || !this.config.categories.has(category)) {
			return fn();
		}

		const start = performance.now();
		const result = await fn();
		const end = performance.now();

		this.debug(category, `${label} took ${(end - start).toFixed(2)}ms`);
		return result;
	}

	/**
	 * オブジェクトの詳細情報をログ出力
	 */
	public dump(category: DebugCategory, label: string, obj: any): void {
		if (!this.config.enabled || !this.config.categories.has(category)) {
			return;
		}

		this.debug(category, `${label}:`);
		console.table(obj);
	}

	/**
	 * 現在の設定を表示
	 */
	public showConfig(): void {
		console.log('Debug Configuration:', this.config);
	}
}

// シングルトンインスタンス
export const debug = new DebugManager();

// 便利なヘルパー関数
export const debugComponent = (message: string, ...args: any[]) =>
	debug.debug(DebugCategory.COMPONENT, message, ...args);

export const debugCanvas = (message: string, ...args: any[]) =>
	debug.debug(DebugCategory.CANVAS, message, ...args);

export const debugEvents = (message: string, ...args: any[]) =>
	debug.debug(DebugCategory.EVENTS, message, ...args);

export const debugSVG = (message: string, ...args: any[]) =>
	debug.debug(DebugCategory.SVG, message, ...args);

export const debugPositioning = (message: string, ...args: any[]) =>
	debug.debug(DebugCategory.POSITIONING, message, ...args);

export const debugUI = (message: string, ...args: any[]) =>
	debug.debug(DebugCategory.UI, message, ...args);

// ブラウザのデベロッパーツール用のグローバル関数
(window as any).circuitDebug = {
	// デバッグの有効/無効を切り替え
	enable: () => debug.setEnabled(true),
	disable: () => debug.setEnabled(false),

	// レベル設定
	setLevel: (level: string) => {
		const levelEnum = DebugLevel[level.toUpperCase() as keyof typeof DebugLevel];
		if (levelEnum !== undefined) {
			debug.setLevel(levelEnum);
			console.log(`Debug level set to: ${level.toUpperCase()}`);
		} else {
			console.error('Invalid level. Use: OFF, ERROR, WARN, INFO, DEBUG, TRACE');
		}
	},

	// カテゴリ設定
	setCategories: (categories: string[]) => {
		const categoryEnums = categories.map(cat =>
			DebugCategory[cat.toUpperCase() as keyof typeof DebugCategory]
		).filter(cat => cat !== undefined);
		debug.setCategories(categoryEnums);
		console.log(`Debug categories set to:`, categories);
	},

	// 設定表示
	showConfig: () => debug.showConfig(),

	// 使用例を表示
	help: () => {
		console.log(`
Circuit Debug Tools:
- circuitDebug.enable() / disable()
- circuitDebug.setLevel('DEBUG') // OFF, ERROR, WARN, INFO, DEBUG, TRACE
- circuitDebug.setCategories(['COMPONENT', 'CANVAS']) // COMPONENT, CANVAS, EVENTS, SVG, POSITIONING, UI
- circuitDebug.showConfig()
- circuitDebug.help()

Examples:
circuitDebug.setLevel('INFO')
circuitDebug.setCategories(['COMPONENT', 'SVG'])
		`);
	}
};

// 初期化時にヘルプを表示
console.log('Circuit Debug Tools loaded. Type "circuitDebug.help()" for usage.');
