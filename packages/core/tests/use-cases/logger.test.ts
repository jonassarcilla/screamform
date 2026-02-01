import { describe, test, expect, vi } from 'bun:test';
import { createLogger } from '@screamform/core/use-cases/logger';

describe('Use Case: createLogger', () => {
	test('should not log anything if isDebug is false', () => {
		const infoSpy = vi.spyOn(console, 'info');
		const logger = createLogger({ isDebug: false });

		logger.info('Test message');
		expect(infoSpy).not.toHaveBeenCalled();
		infoSpy.mockRestore();
	});

	test('should log with the correct prefix and timestamp if isDebug is true', () => {
		const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		const logger = createLogger({ isDebug: true, prefix: 'CustomEngine' });

		logger.debug('System Start');
		expect(debugSpy).toHaveBeenCalledWith(
			expect.stringContaining('[CustomEngine] [DEBUG]: System Start'),
			'',
		);
		debugSpy.mockRestore();
	});

	test('should log info messages with console.info', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const logger = createLogger({ isDebug: true });

		logger.info('Info message', { key: 'value' });
		expect(infoSpy).toHaveBeenCalledWith(
			expect.stringContaining('[FormEngine] [INFO]: Info message'),
			{ key: 'value' },
		);
		infoSpy.mockRestore();
	});

	test('should log warn messages with console.warn', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const logger = createLogger({ isDebug: true });

		logger.warn('Warning message', { issue: 'test' });
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('[FormEngine] [WARN]: Warning message'),
			{ issue: 'test' },
		);
		warnSpy.mockRestore();
	});

	test('should log error messages with console.error', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const logger = createLogger({ isDebug: true });

		logger.error('Error message', { error: 'critical' });
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('[FormEngine] [ERROR]: Error message'),
			{ error: 'critical' },
		);
		errorSpy.mockRestore();
	});

	test('should include timestamp in log messages', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const logger = createLogger({ isDebug: true });

		logger.info('Test with timestamp');
		const call = infoSpy.mock.calls[0]?.[0] as string;
		// Check that the message includes an ISO timestamp pattern
		expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
		infoSpy.mockRestore();
	});

	test('should use default prefix "FormEngine" when not provided', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const logger = createLogger({ isDebug: true });

		logger.info('Default prefix test');
		expect(infoSpy).toHaveBeenCalledWith(
			expect.stringContaining('[FormEngine]'),
			'',
		);
		infoSpy.mockRestore();
	});

	test('should use empty string for data when not provided', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		const logger = createLogger({ isDebug: true });

		logger.info('No data');
		expect(infoSpy).toHaveBeenCalledWith(expect.any(String), '');
		infoSpy.mockRestore();
	});

	test('should log debug messages with console.debug', () => {
		const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
		const logger = createLogger({ isDebug: true, prefix: 'TestEngine' });

		logger.debug('Debug message', { detail: 'verbose' });
		expect(debugSpy).toHaveBeenCalledWith(
			expect.stringContaining('[TestEngine] [DEBUG]: Debug message'),
			{ detail: 'verbose' },
		);
		debugSpy.mockRestore();
	});

	test('should handle all log levels when isDebug is false', () => {
		const infoSpy = vi.spyOn(console, 'info');
		const warnSpy = vi.spyOn(console, 'warn');
		const errorSpy = vi.spyOn(console, 'error');
		const debugSpy = vi.spyOn(console, 'debug');
		const logger = createLogger({ isDebug: false });

		logger.info('info');
		logger.warn('warn');
		logger.error('error');
		logger.debug('debug');

		expect(infoSpy).not.toHaveBeenCalled();
		expect(warnSpy).not.toHaveBeenCalled();
		expect(errorSpy).not.toHaveBeenCalled();
		expect(debugSpy).not.toHaveBeenCalled();

		infoSpy.mockRestore();
		warnSpy.mockRestore();
		errorSpy.mockRestore();
		debugSpy.mockRestore();
	});
});
