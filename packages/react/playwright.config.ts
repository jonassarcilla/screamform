import { defineConfig } from '@playwright/test';

export default defineConfig({
	// Tell Playwright to scan the src directory for .test.tsx or .spec.ts files
	testDir: './src',
	testMatch: '**/*.test.tsx',
	use: {
		baseURL: 'http://localhost:6006', // Default Storybook port
		trace: 'on-first-retry',
	},
	// SOC 2: Run a local web server before testing to ensure the environment is clean
	webServer: {
		command: 'npm run storybook',
		url: 'http://localhost:6006',
		reuseExistingServer: !process.env.CI,
	},
});
