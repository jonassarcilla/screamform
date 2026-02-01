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
					autoSave: false,
				},
			},
		},
		dataConfig: {
			title: 'Initial Project Title',
			budget: 100000,
		},
	},
};
