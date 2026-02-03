import type { Meta, StoryObj } from '@storybook/react';
import { FormContainer } from './FormContainer';

const meta: Meta<typeof FormContainer> = {
	title: 'Components/FormContainer',
	component: FormContainer,
	argTypes: {
		schema: {
			control: 'object',
			description: 'The UI schema defining form fields',
		},
		dataConfig: {
			control: 'object',
			description: 'Initial data configuration for the form',
		},
		isDebug: {
			control: 'boolean',
			description: 'Enable debug logging in the console',
		},
	},
};

export default meta;
type Story = StoryObj<typeof FormContainer>;

export const Default: Story = {
	args: {
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				budget: { widget: 'number', label: 'Budget Limit' },
			},
		},
		dataConfig: {
			title: 'Initial Project Title',
			budget: 100000,
		},
	},
};

export const WithDebug: Story = {
	args: {
		isDebug: true,
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				budget: { widget: 'number', label: 'Budget Limit' },
			},
		},
	},
};

export const WithAutoSaveDisabled: Story = {
	args: {
		isDebug: true,
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					autoSave: false,
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				budget: {
					widget: 'number',
					label: 'Budget Limit',
				},
			},
		},
		dataConfig: {
			title: 'Initial Project Title',
			budget: 100000,
		},
	},
};

export const WithSelectInput: Story = {
	args: {
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				status: {
					widget: 'select',
					label: 'Status',
					placeholder: 'Choose status...',
					options: [
						{ label: 'Draft', value: 'draft' },
						{ label: 'In Review', value: 'in_review' },
						{ label: 'Published', value: 'published' },
					],
				},
			},
		},
		dataConfig: {
			title: 'My Project',
			status: 'draft',
		},
		onSave: async (data) => {
			await new Promise((r) => setTimeout(r, 500));
			console.log('Saved:', data);
		},
	},
};

export const WithMultiSelect: Story = {
	args: {
		schema: {
			fields: {
				name: {
					widget: 'text',
					label: 'Name',
				},
				tags: {
					widget: 'select',
					label: 'Tags',
					multiple: true,
					placeholder: 'Pick tags...',
					options: [
						{ label: 'React', value: 'react' },
						{ label: 'TypeScript', value: 'typescript' },
						{ label: 'Form', value: 'form' },
						{ label: 'UI', value: 'ui' },
					],
					uiProps: { maxItems: 5 },
				},
			},
		},
		dataConfig: {
			name: '',
			tags: ['react', 'typescript'],
		},
		onSave: async (data) => {
			await new Promise((r) => setTimeout(r, 500));
			console.log('Saved:', data);
		},
	},
};
