type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LoggerOptions {
	isDebug: boolean;
	prefix?: string;
}

/**
 * THE CHRONICLER: Handles all engine-level logging.
 * Ensures sensitive data is only logged when the 'isDebug' flag is explicitly true.
 */
export const createLogger = (options: LoggerOptions) => {
	const { isDebug, prefix = 'FormEngine' } = options;

	const log = (level: LogLevel, message: string, data?: any) => {
		if (!isDebug) return;

		const timestamp = new Date().toISOString();
		const formattedMessage = `[${timestamp}] [${prefix}] [${level.toUpperCase()}]: ${message}`;

		switch (level) {
			case 'info':
				console.info(formattedMessage, data ?? '');
				break;
			case 'warn':
				console.warn(formattedMessage, data ?? '');
				break;
			case 'error':
				console.error(formattedMessage, data ?? '');
				break;
			case 'debug':
				console.debug(formattedMessage, data ?? '');
				break;
		}
	};

	return {
		info: (msg: string, data?: any) => log('info', msg, data),
		warn: (msg: string, data?: any) => log('warn', msg, data),
		error: (msg: string, data?: any) => log('error', msg, data),
		debug: (msg: string, data?: any) => log('debug', msg, data),
	};
};
