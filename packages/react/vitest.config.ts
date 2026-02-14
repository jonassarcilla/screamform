import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const dirname =
	typeof __dirname !== 'undefined'
		? __dirname
		: path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		setupFiles: ['./src/__test-utils__/setup.ts'],
		// Exclude the Playwright e2e test that bun test picks up separately
		exclude: ['**/FormContainer.test.tsx', '**/node_modules/**', '**/dist/**'],
	},
	resolve: {
		alias: {
			'@': path.resolve(dirname, './src'),
			'@screamform/core': path.resolve(dirname, '../core/src/index.ts'),
		},
	},
});
