import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import reactScan from '@react-scan/vite-plugin-react-scan';

const dirname_ = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	// React Scan script is loaded at runtime by FormContainer when isDebug is true
	addons: [
		'@storybook/addon-controls',
		'@storybook/addon-actions',
		'@storybook/addon-a11y',
		'@storybook/addon-docs',
		'@storybook/addon-interactions',
	],
	framework: '@storybook/react-vite',
	async viteFinal(config) {
		config.plugins ??= [];
		config.plugins.push(tailwindcss());
		// React Scan: display names only; enable: false so no overlay. FormContainer loads script when isDebug is true.
		config.plugins.push(
			reactScan({
				enable: false,
				autoDisplayNames: true,
				scanOptions: {},
			}),
		);
		// HMR + file watching so saves trigger hot reload (helps on Windows/WSL)
		config.server = config.server ?? {};
		config.server.hmr = true;
		// Polling ensures file saves are detected (fixes HMR on Windows/WSL)
		config.server.watch = {
			...config.server.watch,
			usePolling: true,
			interval: 500,
		};
		// Don't pre-bundle workspace core or react-scan so changes trigger HMR
		config.optimizeDeps = config.optimizeDeps ?? {};
		config.optimizeDeps.exclude = [
			...(config.optimizeDeps.exclude ?? []),
			'@screamform/core',
		];
		config.resolve = config.resolve ?? {};
		const coreSrc = path.resolve(dirname_, '../../core/src/index.ts');
		const srcAlias = path.resolve(dirname_, '../src');
		const existing =
			config.resolve.alias == null
				? []
				: Array.isArray(config.resolve.alias)
					? config.resolve.alias
					: Object.entries(config.resolve.alias).map(([find, replacement]) => ({
							find,
							replacement: replacement as string,
						}));
		config.resolve.alias = [
			{ find: '@screamform/core', replacement: coreSrc },
			{ find: '@', replacement: srcAlias },
			...existing,
		];
		return config;
	},
};
export default config;
