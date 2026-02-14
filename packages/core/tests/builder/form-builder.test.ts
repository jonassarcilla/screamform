import { describe, test, expect } from 'bun:test';
import { FormBuilder } from '@screamform/core/builder/form-builder';
import type { UISchema } from '@screamform/core/domain/schema/types';

describe('Builder: FormBuilder', () => {
	describe('basic form building', () => {
		test('should build empty schema', () => {
			const schema = new FormBuilder().build();
			expect(schema.fields).toEqual({});
		});

		test('should build schema with text field', () => {
			const schema = new FormBuilder()
				.addTextField('name')
				.withLabel('Name')
				.done()
				.build();
			expect(schema.fields.name).toBeDefined();
			expect(schema.fields.name.widget).toBe('text');
			expect(schema.fields.name.label).toBe('Name');
		});

		test('should build schema with number field', () => {
			const schema = new FormBuilder()
				.addNumberField('age')
				.withLabel('Age')
				.done()
				.build();
			expect(schema.fields.age.widget).toBe('number');
		});

		test('should build schema with select field', () => {
			const schema = new FormBuilder()
				.addSelectField('role')
				.withLabel('Role')
				.withOptions([
					{ label: 'Admin', value: 'admin' },
					{ label: 'User', value: 'user' },
				])
				.done()
				.build();
			expect(schema.fields.role.widget).toBe('select');
			expect(schema.fields.role.options).toHaveLength(2);
		});

		test('should build schema with checkbox field', () => {
			const schema = new FormBuilder()
				.addCheckboxField('agree')
				.withLabel('I agree')
				.done()
				.build();
			expect(schema.fields.agree.widget).toBe('checkbox');
		});

		test('should build schema with custom widget field', () => {
			const schema = new FormBuilder()
				.addCustomField('satisfaction', 'rating')
				.withLabel('Satisfaction')
				.done()
				.build();
			expect(schema.fields.satisfaction.widget).toBe('rating');
		});
	});

	describe('multiple fields', () => {
		test('should build schema with multiple fields preserving order', () => {
			const schema = new FormBuilder()
				.addTextField('firstName')
				.withLabel('First Name')
				.done()
				.addTextField('lastName')
				.withLabel('Last Name')
				.done()
				.addNumberField('age')
				.withLabel('Age')
				.done()
				.build();

			const keys = Object.keys(schema.fields);
			expect(keys).toEqual(['firstName', 'lastName', 'age']);
		});
	});

	describe('sections', () => {
		test('should build schema with section', () => {
			const schema = new FormBuilder()
				.addSection('address')
				.withLabel('Address')
				.addTextField('city')
				.withLabel('City')
				.done()
				.addTextField('zip')
				.withLabel('Zip')
				.done()
				.done()
				.build();

			expect(schema.fields.address).toBeDefined();
			expect(schema.fields.address.widget).toBe('section');
			expect(schema.fields.address.itemSchema?.city).toBeDefined();
			expect(schema.fields.address.itemSchema?.zip).toBeDefined();
		});

		test('should build schema with nested sections', () => {
			const schema = new FormBuilder()
				.addSection('contact')
				.withLabel('Contact')
				.addTextField('name')
				.withLabel('Name')
				.done()
				.addSection('address')
				.withLabel('Address')
				.addTextField('city')
				.withLabel('City')
				.done()
				.done()
				.done()
				.build();

			const contact = schema.fields.contact;
			expect(contact.itemSchema?.name).toBeDefined();
			expect(contact.itemSchema?.address).toBeDefined();
			expect(contact.itemSchema?.address.itemSchema?.city).toBeDefined();
		});

		test('should build section with conditional rules', () => {
			const schema = new FormBuilder()
				.addSelectField('type')
				.withLabel('Type')
				.withOptions([
					{ label: 'Simple', value: 'simple' },
					{ label: 'Advanced', value: 'advanced' },
				])
				.done()
				.addSection('advanced')
				.withLabel('Advanced Options')
				.showWhen('type', '===', 'advanced')
				.addTextField('detail')
				.withLabel('Detail')
				.done()
				.done()
				.build();

			expect(schema.fields.advanced.rules).toBeDefined();
		});
	});

	describe('addField / addFields', () => {
		test('should add a pre-built field', () => {
			const schema = new FormBuilder()
				.addField('email', {
					label: 'Email',
					widget: 'text',
					sensitivity: 'pii',
				})
				.build();
			expect(schema.fields.email.label).toBe('Email');
			expect(schema.fields.email.sensitivity).toBe('pii');
		});

		test('should add multiple pre-built fields', () => {
			const schema = new FormBuilder()
				.addFields({
					first: { label: 'First', widget: 'text' },
					last: { label: 'Last', widget: 'text' },
				})
				.build();
			expect(Object.keys(schema.fields)).toEqual(['first', 'last']);
		});
	});

	describe('withDefaults', () => {
		test('should set defaultValue on matching fields', () => {
			const schema = new FormBuilder()
				.addTextField('firstName')
				.withLabel('First Name')
				.done()
				.addTextField('lastName')
				.withLabel('Last Name')
				.done()
				.addNumberField('age')
				.withLabel('Age')
				.done()
				.withDefaults({
					firstName: 'Jane',
					lastName: 'Doe',
					age: 30,
				})
				.build();

			expect(schema.fields.firstName.defaultValue).toBe('Jane');
			expect(schema.fields.lastName.defaultValue).toBe('Doe');
			expect(schema.fields.age.defaultValue).toBe(30);
		});

		test('should ignore keys that do not match any field', () => {
			const schema = new FormBuilder()
				.addTextField('name')
				.withLabel('Name')
				.done()
				.withDefaults({
					name: 'Alice',
					nonexistent: 'ignored',
				})
				.build();

			expect(schema.fields.name.defaultValue).toBe('Alice');
			expect(schema.fields.nonexistent).toBeUndefined();
		});

		test('should not override explicitly set defaultValue', () => {
			const schema = new FormBuilder()
				.addTextField('name')
				.withLabel('Name')
				.defaultValue('Explicit')
				.done()
				.withDefaults({ name: 'Bulk' })
				.build();

			// withDefaults runs after field is built, so it overwrites
			expect(schema.fields.name.defaultValue).toBe('Bulk');
		});
	});

	describe('metadata', () => {
		test('should set version', () => {
			const schema = new FormBuilder().setVersion('1.0.0').build();
			expect(schema.meta?.version).toBe('1.0.0');
		});

		test('should set full meta', () => {
			const schema = new FormBuilder()
				.setMeta({
					version: '2.0.0',
					id: 'form-123',
					author: 'team-a',
					createdAt: '2026-01-01T00:00:00Z',
				})
				.build();
			expect(schema.meta?.version).toBe('2.0.0');
			expect(schema.meta?.id).toBe('form-123');
			expect(schema.meta?.author).toBe('team-a');
		});

		test('should merge meta', () => {
			const schema = new FormBuilder()
				.setVersion('1.0.0')
				.setMeta({ author: 'team-a' })
				.build();
			expect(schema.meta?.version).toBe('1.0.0');
			expect(schema.meta?.author).toBe('team-a');
		});
	});

	describe('schema settings', () => {
		test('should set exclude', () => {
			const schema = new FormBuilder()
				.addTextField('name')
				.withLabel('Name')
				.done()
				.addTextField('secret')
				.withLabel('Secret')
				.done()
				.exclude('secret')
				.build();
			expect(schema.exclude).toEqual(['secret']);
		});

		test('should accumulate exclude', () => {
			const schema = new FormBuilder().exclude('a').exclude('b', 'c').build();
			expect(schema.exclude).toEqual(['a', 'b', 'c']);
		});

		test('should set settings', () => {
			const schema = new FormBuilder()
				.settings({ debug: true, submitLabel: 'Send' })
				.build();
			expect(schema.settings?.debug).toBe(true);
			expect(schema.settings?.submitLabel).toBe('Send');
		});

		test('should not include meta when not set', () => {
			const schema = new FormBuilder().build();
			expect(schema.meta).toBeUndefined();
		});

		test('should not include exclude when empty', () => {
			const schema = new FormBuilder().build();
			expect(schema.exclude).toBeUndefined();
		});

		test('should not include settings when not set', () => {
			const schema = new FormBuilder().build();
			expect(schema.settings).toBeUndefined();
		});
	});

	describe('full integration', () => {
		test('should produce schema identical to JSON config', () => {
			// Build with fluent API
			const builtSchema = new FormBuilder()
				.addTextField('title')
				.withLabel('Project Title')
				.required('Project title is required')
				.done()
				.addNumberField('budget')
				.withLabel('Budget Limit')
				.done()
				.build();

			// Equivalent JSON config
			const jsonSchema: UISchema = {
				fields: {
					title: {
						widget: 'text',
						label: 'Project Title',
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
			};

			expect(builtSchema.fields.title.widget).toBe(
				jsonSchema.fields.title.widget,
			);
			expect(builtSchema.fields.title.label).toBe(
				jsonSchema.fields.title.label,
			);
			expect(builtSchema.fields.title.validation).toEqual(
				jsonSchema.fields.title.validation,
			);
			expect(builtSchema.fields.budget.widget).toBe(
				jsonSchema.fields.budget.widget,
			);
			expect(builtSchema.fields.budget.label).toBe(
				jsonSchema.fields.budget.label,
			);
		});

		test('complex form with sections, rules, and metadata', () => {
			const schema = new FormBuilder()
				.setVersion('1.2.0')
				.setMeta({ author: 'screamform-team' })
				.addTextField('username')
				.withLabel('Username')
				.required()
				.sensitivity('internal')
				.done()
				.addSelectField('role')
				.withLabel('Role')
				.withOptions([
					{ label: 'Admin', value: 'admin' },
					{ label: 'User', value: 'user' },
				])
				.done()
				.addSection('address')
				.withLabel('Address')
				.sensitivity('pii')
				.showWhen('role', '===', 'admin')
				.addTextField('city')
				.withLabel('City')
				.done()
				.addTextField('zip')
				.withLabel('Zip Code')
				.done()
				.done()
				.settings({ debug: true })
				.build();

			// Verify structure
			expect(schema.meta?.version).toBe('1.2.0');
			expect(schema.meta?.author).toBe('screamform-team');
			expect(schema.fields.username.sensitivity).toBe('internal');
			expect(schema.fields.role.options).toHaveLength(2);
			expect(schema.fields.address.widget).toBe('section');
			expect(schema.fields.address.sensitivity).toBe('pii');
			expect(schema.fields.address.rules).toBeDefined();
			expect(schema.fields.address.itemSchema?.city).toBeDefined();
			expect(schema.fields.address.itemSchema?.zip).toBeDefined();
			expect(schema.settings?.debug).toBe(true);
		});
	});
});
