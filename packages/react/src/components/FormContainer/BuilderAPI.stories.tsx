import {
	FormBuilder,
	createSection,
	createTextField,
	deepFreeze,
	getPIIFields,
	validateSchema,
} from '@screamform/core';
import type { Meta, StoryObj } from '@storybook/react';
import { FormContainer } from './FormContainer';

const meta: Meta<typeof FormContainer> = {
	title: 'Builder API/FormBuilder',
	component: FormContainer,
	parameters: {
		docs: {
			description: {
				component:
					'Demonstrates the **Fluent Builder API** for constructing UISchema objects. The builder produces identical schemas to JSON config — it is purely additive DX sugar.',
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof FormContainer>;

// ---------------------------------------------------------------------------
// 1. Basic Builder Usage
// ---------------------------------------------------------------------------

const basicSchema = new FormBuilder()
	.addTextField('title')
	.withLabel('Project Title')
	.placeholder('Enter project name...')
	.required('Project title is required')
	.done()
	.addNumberField('budget')
	.withLabel('Budget Limit')
	.placeholder('0')
	.required('Budget is required')
	.done()
	.addSelectField('status')
	.withLabel('Status')
	.required('Status is required')
	.withOptions([
		{ label: 'Draft', value: 'draft' },
		{ label: 'In Review', value: 'in_review' },
		{ label: 'Published', value: 'published' },
	])
	.done()
	.build();

export const BasicBuilder: Story = {
	name: 'Basic Builder',
	args: {
		schema: basicSchema,
		dataConfig: { title: 'My Project', budget: 50000, status: 'draft' },
	},
	parameters: {
		docs: {
			description: {
				story:
					'Simple form built with `new FormBuilder().addTextField(...).done().build()`. Produces the same UISchema as a JSON config object.',
			},
		},
	},
};

// ---------------------------------------------------------------------------
// 2. Builder with Rules (Conditional Visibility)
// ---------------------------------------------------------------------------

const rulesSchema = new FormBuilder()
	.addSelectField('type')
	.withLabel('Project Type')
	.withOptions([
		{ label: 'Simple', value: 'simple' },
		{ label: 'Advanced', value: 'advanced' },
	])
	.done()
	.addTextField('simpleNote')
	.withLabel('Simple Note')
	.showWhen('type', '===', 'simple')
	.done()
	.addTextField('advancedConfig')
	.withLabel('Advanced Configuration')
	.placeholder('JSON config...')
	.showWhen('type', '===', 'advanced')
	.done()
	.addTextField('criticalField')
	.withLabel('Critical (visible when Advanced AND budget > 1000)')
	.showWhenAll([
		['type', '===', 'advanced'],
		['budget', '>', 1000],
	])
	.done()
	.addNumberField('budget')
	.withLabel('Budget')
	.done()
	.build();

export const BuilderWithRules: Story = {
	name: 'Builder with Conditional Rules',
	args: {
		schema: rulesSchema,
		dataConfig: { type: 'simple', budget: 0 },
	},
	parameters: {
		docs: {
			description: {
				story:
					'Fields use `.showWhen()` and `.showWhenAll()` for conditional visibility. Change "Project Type" to see fields appear/disappear. Set type to "Advanced" and budget > 1000 to see the critical field.',
			},
		},
	},
};

// ---------------------------------------------------------------------------
// 3. Builder with Schema Metadata (SOC 2)
// ---------------------------------------------------------------------------

const metaSchema = new FormBuilder()
	.setVersion('2.1.0')
	.setMeta({
		id: 'employee-onboarding',
		author: 'hr-team',
		createdAt: '2026-01-15T10:00:00Z',
		description: 'New employee onboarding form',
	})
	.addTextField('fullName')
	.withLabel('Full Name')
	.sensitivity('internal')
	.required()
	.done()
	.addTextField('email')
	.withLabel('Email')
	.sensitivity('pii')
	.required('Email is required')
	.done()
	.addTextField('ssn')
	.withLabel('SSN (last 4)')
	.sensitivity('pii')
	.placeholder('XXXX')
	.done()
	.addSelectField('department')
	.withLabel('Department')
	.withOptions([
		{ label: 'Engineering', value: 'eng' },
		{ label: 'Design', value: 'design' },
		{ label: 'Product', value: 'product' },
	])
	.done()
	.build();

// Demonstrate security utilities
const piiFields = getPIIFields(metaSchema);
const schemaIssues = validateSchema(metaSchema);
const frozenSchema = deepFreeze({ ...metaSchema });

export const BuilderWithMetadata: Story = {
	name: 'Schema Metadata & Compliance',
	args: {
		schema: metaSchema,
		dataConfig: { fullName: '', email: '', ssn: '', department: undefined },
	},
	parameters: {
		docs: {
			description: {
				story: [
					'Schema built with `.setVersion()` and `.setMeta()` for SOC 2 compliance.',
					'',
					`**Schema version:** ${metaSchema.meta?.version}`,
					`**Schema ID:** ${metaSchema.meta?.id}`,
					`**Author:** ${metaSchema.meta?.author}`,
					'',
					`**PII fields:** ${piiFields.join(', ') || 'none'}`,
					`**Schema validation issues:** ${schemaIssues.length === 0 ? 'none (valid)' : schemaIssues.map((i) => i.message).join('; ')}`,
					`**Schema frozen:** ${Object.isFrozen(frozenSchema)}`,
				].join('\n'),
			},
		},
	},
};

// ---------------------------------------------------------------------------
// 4. Composable Fields (Standalone Factories)
// ---------------------------------------------------------------------------

const emailField = createTextField('email')
	.withLabel('Email Address')
	.placeholder('you@example.com')
	.sensitivity('pii')
	.required('Email is required')
	.build();

const nameField = createTextField('name')
	.withLabel('Full Name')
	.required()
	.build();

const notesSection = createSection('contactInfo')
	.withLabel('Contact Information')
	.addTextField('phone')
	.withLabel('Phone')
	.placeholder('555-0000')
	.done()
	.addTextField('website')
	.withLabel('Website')
	.placeholder('https://...')
	.done()
	.build();

const composedSchema = new FormBuilder()
	.addField(nameField.key, nameField.field)
	.addField(emailField.key, emailField.field)
	.addField(notesSection.key, notesSection.field)
	.setVersion('1.0.0')
	.build();

export const ComposableFields: Story = {
	name: 'Composable Fields (Factories)',
	args: {
		schema: composedSchema,
		dataConfig: {},
		isDebug: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Fields created with standalone factories (`createTextField`, `createSection`) and composed into a form via `.addField()`. Enables reuse of field definitions across forms.',
			},
		},
	},
};

// ---------------------------------------------------------------------------
// 5. Builder with Defaults
// ---------------------------------------------------------------------------

const defaultsSchema = new FormBuilder()
	.addTextField('firstName')
	.withLabel('First Name')
	.done()
	.addTextField('lastName')
	.withLabel('Last Name')
	.done()
	.addSelectField('country')
	.withLabel('Country')
	.withOptions([
		{ label: 'United States', value: 'us' },
		{ label: 'Philippines', value: 'ph' },
		{ label: 'Japan', value: 'jp' },
	])
	.done()
	.withDefaults({
		firstName: 'Juan',
		lastName: 'Dela Cruz',
		country: 'ph',
	})
	.build();

export const BuilderWithDefaults: Story = {
	name: 'Builder with Defaults',
	args: {
		schema: defaultsSchema,
		dataConfig: {},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Uses `.withDefaults()` to bulk-set default values. These are baked into the schema — `dataConfig` at runtime would override them.',
			},
		},
	},
};

// ---------------------------------------------------------------------------
// 6. Builder vs JSON Config (Side by Side)
// ---------------------------------------------------------------------------

// JSON config approach (existing)
const jsonSchema = {
	fields: {
		title: {
			widget: 'text' as const,
			label: 'Project Title',
			validation: {
				type: 'required' as const,
				errorMessage: 'Title is required',
			},
		},
		budget: {
			widget: 'number' as const,
			label: 'Budget',
		},
		status: {
			widget: 'select' as const,
			label: 'Status',
			options: [
				{ label: 'Draft', value: 'draft' },
				{ label: 'Active', value: 'active' },
			],
		},
	},
};

// Builder approach (same output)
const builderSchema = new FormBuilder()
	.addTextField('title')
	.withLabel('Project Title')
	.required('Title is required')
	.done()
	.addNumberField('budget')
	.withLabel('Budget')
	.done()
	.addSelectField('status')
	.withLabel('Status')
	.withOptions([
		{ label: 'Draft', value: 'draft' },
		{ label: 'Active', value: 'active' },
	])
	.done()
	.build();

export const JSONConfigEquivalent: Story = {
	name: 'JSON Config (for comparison)',
	args: {
		schema: jsonSchema,
		dataConfig: { title: 'Test', budget: 1000, status: 'draft' },
	},
	parameters: {
		docs: {
			description: {
				story:
					'This story uses the **traditional JSON config** approach. Compare with the "Builder Equivalent" story — both produce identical forms.',
			},
		},
	},
};

export const BuilderEquivalent: Story = {
	name: 'Builder Equivalent (same output)',
	args: {
		schema: builderSchema,
		dataConfig: { title: 'Test', budget: 1000, status: 'draft' },
	},
	parameters: {
		docs: {
			description: {
				story:
					'This story uses the **Fluent Builder API**. It produces the exact same UISchema as the "JSON Config" story. Both approaches are fully supported.',
			},
		},
	},
};
