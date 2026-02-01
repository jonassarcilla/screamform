import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const dirname_ = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: [
		'@storybook/addon-controls',
		'@storybook/addon-actions',
		'@storybook/addon-a11y',
		'@storybook/addon-docs',
		'@storybook/addon-interactions',
	],
	framework: '@storybook/react-vite',
	async viteFinal(config) {
		config.plugins?.push(tailwindcss());
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
