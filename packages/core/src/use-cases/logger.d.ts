export interface LoggerOptions {
	isDebug: boolean;
	prefix?: string;
}
/**
 * THE CHRONICLER: Handles all engine-level logging.
 * Ensures sensitive data is only logged when the 'isDebug' flag is explicitly true.
 */
export declare const createLogger: (options: LoggerOptions) => {
	info: (msg: string, data?: any) => void;
	warn: (msg: string, data?: any) => void;
	error: (msg: string, data?: any) => void;
	debug: (msg: string, data?: any) => void;
};
//# sourceMappingURL=logger.d.ts.map
