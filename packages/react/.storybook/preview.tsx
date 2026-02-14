import type { Preview } from '@storybook/react';
import '../src/styles/global.css';

const preview: Preview = {
	parameters: {
		layout: 'centered',
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	// 🟢 Add this decorator to ensure a clean rendering context
	decorators: [
		(Story) => (
			<div className="min-h-[400px] w-[400px] p-4 font-sans text-foreground antialiased">
				<Story />
			</div>
		),
	],
};

export default preview;
