import { describe, test, expect } from 'bun:test';
import {
	createTextField,
	createNumberField,
	createSelectField,
	createCheckboxField,
	createCustomField,
	createSection,
} from '@screamform/core/builder/factories';
import { FormBuilder } from '@screamform/core/builder/form-builder';

describe('Builder: Factories', () => {
	test('createTextField creates a text field builder', () => {
		const { key, field } = createTextField('name')
			.withLabel('Name')
			.required()
			.build();
		expect(key).toBe('name');
		expect(field.widget).toBe('text');
		expect(field.label).toBe('Name');
		expect(field.validation).toBeDefined();
	});

	test('createNumberField creates a number field builder', () => {
		const { key, field } = createNumberField('age').withLabel('Age').build();
		expect(key).toBe('age');
		expect(field.widget).toBe('number');
	});

	test('createSelectField creates a select field builder', () => {
		const { key, field } = createSelectField('role')
			.withLabel('Role')
			.withOptions([
				{ label: 'Admin', value: 'admin' },
				{ label: 'User', value: 'user' },
			])
			.build();
		expect(key).toBe('role');
		expect(field.widget).toBe('select');
		expect(field.options).toHaveLength(2);
	});

	test('createCheckboxField creates a checkbox field builder', () => {
		const { key, field } = createCheckboxField('agree')
			.withLabel('I agree')
			.build();
		expect(key).toBe('agree');
		expect(field.widget).toBe('checkbox');
	});

	test('createCustomField creates a custom widget field builder', () => {
		const { key, field } = createCustomField('rating', 'star-rating')
			.withLabel('Rating')
			.build();
		expect(key).toBe('rating');
		expect(field.widget).toBe('star-rating');
	});

	test('createSection creates a section builder', () => {
		const { key, field } = createSection('address')
			.withLabel('Address')
			.addTextField('city')
			.withLabel('City')
			.done()
			.build();
		expect(key).toBe('address');
		expect(field.widget).toBe('section');
		expect(field.itemSchema?.city.label).toBe('City');
	});

	test('standalone factories should throw on done()', () => {
		expect(() => createTextField('name').done()).toThrow();
		expect(() => createSection('section').done()).toThrow();
	});

	describe('composability with FormBuilder', () => {
		test('should compose standalone fields into a form', () => {
			const emailField = createTextField('email')
				.withLabel('Email')
				.sensitivity('pii')
				.required()
				.build();

			const addressSection = createSection('address')
				.withLabel('Address')
				.addTextField('city')
				.withLabel('City')
				.done()
				.addTextField('zip')
				.withLabel('Zip')
				.done()
				.build();

			const schema = new FormBuilder()
				.addField(emailField.key, emailField.field)
				.addField(addressSection.key, addressSection.field)
				.build();

			expect(schema.fields.email.label).toBe('Email');
			expect(schema.fields.email.sensitivity).toBe('pii');
			expect(schema.fields.address.itemSchema?.city).toBeDefined();
		});

		test('should compose multiple standalone fields via addFields', () => {
			const nameField = createTextField('name').withLabel('Name').build();
			const ageField = createNumberField('age').withLabel('Age').build();

			const schema = new FormBuilder()
				.addFields({
					[nameField.key]: nameField.field,
					[ageField.key]: ageField.field,
				})
				.build();

			expect(schema.fields.name.label).toBe('Name');
			expect(schema.fields.age.label).toBe('Age');
		});
	});
});
