import path from 'node:path';
import { defineConfig, type LibraryFormats } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import reactScan from '@react-scan/vite-plugin-react-scan';

// React Scan: plugin adds display names only; enable: false so plugin does not inject the overlay.
// FormContainer loads the overlay script at runtime only when isDebug is true.
export default defineConfig(() => ({
	plugins: [
		react(),
		tailwindcss(),
		reactScan({
			enable: false,
			autoDisplayNames: true,
			scanOptions: {},
		}),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		lib: {
			entry: path.resolve(__dirname, 'src/index.ts'),
			name: 'ScreamformReact',
			formats: ['es'] as LibraryFormats[],
			fileName: (_format: string) => 'index.js',
		},
		rollupOptions: {
			external: ['react', 'react-dom', '@screamform/core'],
		},
		outDir: 'dist',
		emptyOutDir: true,
		sourcemap: true,
	},
}));
