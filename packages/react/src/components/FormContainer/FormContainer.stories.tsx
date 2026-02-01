import type { Meta, StoryObj } from '@storybook/react';
import { FormContainer } from './FormContainer';

const meta: Meta<typeof FormContainer> = {
	title: 'Components/FormContainer',
	component: FormContainer,
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
	},
};
