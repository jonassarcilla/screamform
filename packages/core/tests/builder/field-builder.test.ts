import { describe, test, expect } from 'bun:test';
import { FieldBuilder } from '@screamform/core/builder/field-builder';

describe('Builder: FieldBuilder', () => {
	describe('basic properties', () => {
		test('should build a minimal text field', () => {
			const { key, field } = new FieldBuilder('name', 'text').build();
			expect(key).toBe('name');
			expect(field.widget).toBe('text');
			expect(field.label).toBe('name'); // defaults to key
		});

		test('should set label', () => {
			const { field } = new FieldBuilder('name', 'text')
				.withLabel('Full Name')
				.build();
			expect(field.label).toBe('Full Name');
		});

		test('should set placeholder', () => {
			const { field } = new FieldBuilder('name', 'text')
				.placeholder('Enter name')
				.build();
			expect(field.placeholder).toBe('Enter name');
		});

		test('should set description', () => {
			const { field } = new FieldBuilder('name', 'text')
				.description('Your full name')
				.build();
			expect(field.description).toBe('Your full name');
		});

		test('should set defaultValue', () => {
			const { field } = new FieldBuilder('name', 'text')
				.defaultValue('John')
				.build();
			expect(field.defaultValue).toBe('John');
		});

		test('should set bindPath', () => {
			const { field } = new FieldBuilder('city', 'text')
				.bindPath('user.profile.city')
				.build();
			expect(field.bindPath).toBe('user.profile.city');
		});

		test('should set dataType', () => {
			const { field } = new FieldBuilder('age', 'number')
				.dataType('number')
				.build();
			expect(field.dataType).toBe('number');
		});

		test('should set multiple dataTypes', () => {
			const { field } = new FieldBuilder('code', 'text')
				.dataType(['string', 'code'])
				.build();
			expect(field.dataType).toEqual(['string', 'code']);
		});

		test('should set autoSave', () => {
			const { field } = new FieldBuilder('name', 'text')
				.autoSave(false)
				.build();
			expect(field.autoSave).toBe(false);
		});

		test('should set transform', () => {
			const { field } = new FieldBuilder('name', 'text')
				.transform('uppercase')
				.build();
			expect(field.transform).toBe('uppercase');
		});

		test('should set template', () => {
			const { field } = new FieldBuilder('greeting', 'text')
				.template('Hello, {{name}}!')
				.build();
			expect(field.template).toBe('Hello, {{name}}!');
		});

		test('should set sensitivity', () => {
			const { field } = new FieldBuilder('ssn', 'text')
				.sensitivity('pii')
				.build();
			expect(field.sensitivity).toBe('pii');
		});
	});

	describe('select/multi-select', () => {
		test('should set options', () => {
			const { field } = new FieldBuilder('role', 'select')
				.withOptions([
					{ label: 'Admin', value: 'admin' },
					{ label: 'User', value: 'user' },
				])
				.build();
			expect(field.options).toHaveLength(2);
			expect(field.options?.[0].label).toBe('Admin');
		});

		test('should set multiple', () => {
			const { field } = new FieldBuilder('tags', 'select').multiple().build();
			expect(field.multiple).toBe(true);
		});

		test('should set multiple with maxItems', () => {
			const { field } = new FieldBuilder('tags', 'select').multiple(5).build();
			expect(field.multiple).toBe(true);
			expect(field.uiProps?.maxItems).toBe(5);
		});
	});

	describe('validation', () => {
		test('should set required validation', () => {
			const { field } = new FieldBuilder('name', 'text').required().build();
			expect(field.validation).toEqual({
				type: 'required',
				errorMessage: 'This field is required',
			});
		});

		test('should set required with custom message', () => {
			const { field } = new FieldBuilder('name', 'text')
				.required('Name cannot be empty')
				.build();
			expect(field.validation).toEqual({
				type: 'required',
				errorMessage: 'Name cannot be empty',
			});
		});

		test('should set custom validation', () => {
			const { field } = new FieldBuilder('email', 'text')
				.validation({
					operator: 'and',
					rules: [
						{ type: 'required', errorMessage: 'Email required' },
						{
							type: 'regex',
							value: '^.+@.+$',
							errorMessage: 'Invalid email',
						},
					],
				})
				.build();
			expect('operator' in (field.validation ?? {})).toBe(true);
		});
	});

	describe('uiProps', () => {
		test('should set uiProps', () => {
			const { field } = new FieldBuilder('name', 'text')
				.uiProps({ searchable: true })
				.build();
			expect(field.uiProps?.searchable).toBe(true);
		});

		test('should merge uiProps', () => {
			const { field } = new FieldBuilder('name', 'text')
				.multiple(5)
				.uiProps({ searchable: true })
				.build();
			expect(field.uiProps?.maxItems).toBe(5);
			expect(field.uiProps?.searchable).toBe(true);
		});
	});

	describe('rules (simple)', () => {
		test('should add showWhen rule', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.showWhen('type', '===', 'advanced')
				.build();
			const rule = field.rules;
			expect(rule).toBeDefined();
			expect((rule as { effect: string }).effect).toBe('SHOW');
		});

		test('should add hideWhen rule', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.hideWhen('type', '===', 'simple')
				.build();
			expect((field.rules as { effect: string }).effect).toBe('HIDE');
		});

		test('should add disableWhen rule', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.disableWhen('locked', '===', true)
				.build();
			expect((field.rules as { effect: string }).effect).toBe('DISABLE');
		});

		test('should add enableWhen rule', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.enableWhen('editable', '===', true)
				.build();
			expect((field.rules as { effect: string }).effect).toBe('ENABLE');
		});

		test('should add requireWhen rule', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.requireWhen('mandatory', '===', true)
				.build();
			expect((field.rules as { effect: string }).effect).toBe('REQUIRE');
		});

		test('should add optionalWhen rule', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.optionalWhen('optional', '===', true)
				.build();
			expect((field.rules as { effect: string }).effect).toBe('OPTIONAL');
		});

		test('should accumulate multiple rules as array', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.showWhen('type', '===', 'advanced')
				.disableWhen('locked', '===', true)
				.build();
			expect(Array.isArray(field.rules)).toBe(true);
			expect((field.rules as unknown[]).length).toBe(2);
		});
	});

	describe('rules (compound)', () => {
		test('showWhenAll creates AND group', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.showWhenAll([
					['role', '===', 'admin'],
					['active', '===', true],
				])
				.build();
			const rule = field.rules as {
				condition: { operator: string; conditions: unknown[] };
			};
			expect(rule.condition.operator).toBe('and');
			expect(rule.condition.conditions).toHaveLength(2);
		});

		test('showWhenAny creates OR group', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.showWhenAny([
					['role', '===', 'admin'],
					['role', '===', 'editor'],
				])
				.build();
			const rule = field.rules as { condition: { operator: string } };
			expect(rule.condition.operator).toBe('or');
		});

		test('hideWhenAll creates AND group', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.hideWhenAll([
					['archived', '===', true],
					['deleted', '===', true],
				])
				.build();
			const rule = field.rules as {
				effect: string;
				condition: { operator: string };
			};
			expect(rule.effect).toBe('HIDE');
			expect(rule.condition.operator).toBe('and');
		});

		test('hideWhenAny creates OR group', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.hideWhenAny([
					['status', '===', 'archived'],
					['status', '===', 'deleted'],
				])
				.build();
			const rule = field.rules as {
				effect: string;
				condition: { operator: string };
			};
			expect(rule.effect).toBe('HIDE');
			expect(rule.condition.operator).toBe('or');
		});

		test('disableWhenAll creates AND group', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.disableWhenAll([
					['locked', '===', true],
					['frozen', '===', true],
				])
				.build();
			const rule = field.rules as {
				effect: string;
				condition: { operator: string };
			};
			expect(rule.effect).toBe('DISABLE');
			expect(rule.condition.operator).toBe('and');
		});

		test('disableWhenAny creates OR group', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.disableWhenAny([
					['locked', '===', true],
					['frozen', '===', true],
				])
				.build();
			const rule = field.rules as {
				effect: string;
				condition: { operator: string };
			};
			expect(rule.effect).toBe('DISABLE');
			expect(rule.condition.operator).toBe('or');
		});
	});

	describe('rawRules', () => {
		test('should accept a single raw rule', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.rawRules({
					effect: 'SHOW',
					condition: { field: 'role', operator: '===', value: 'admin' },
				})
				.build();
			expect(field.rules).toBeDefined();
		});

		test('should accept an array of raw rules', () => {
			const { field } = new FieldBuilder('detail', 'text')
				.rawRules([
					{
						effect: 'SHOW',
						condition: { field: 'role', operator: '===', value: 'admin' },
					},
					{
						effect: 'DISABLE',
						condition: { field: 'locked', operator: '===', value: true },
					},
				])
				.build();
			expect(Array.isArray(field.rules)).toBe(true);
			expect((field.rules as unknown[]).length).toBe(2);
		});
	});

	describe('chaining', () => {
		test('all methods should return this for chaining', () => {
			const builder = new FieldBuilder('name', 'text');
			const result = builder
				.withLabel('Name')
				.placeholder('Enter')
				.description('Your name')
				.defaultValue('John')
				.bindPath('user.name')
				.dataType('string')
				.autoSave(true)
				.sensitivity('public')
				.uiProps({ searchable: true })
				.transform('trim');
			expect(result).toBe(builder);
		});

		test('should produce complete field from full chain', () => {
			const { field } = new FieldBuilder('email', 'text')
				.withLabel('Email Address')
				.placeholder('you@example.com')
				.description('We will never share your email')
				.sensitivity('pii')
				.required('Email is required')
				.build();

			expect(field.label).toBe('Email Address');
			expect(field.placeholder).toBe('you@example.com');
			expect(field.description).toBe('We will never share your email');
			expect(field.sensitivity).toBe('pii');
			expect(field.validation).toBeDefined();
		});
	});

	describe('done() and standalone mode', () => {
		test('done() should throw in standalone mode', () => {
			const builder = new FieldBuilder('name', 'text');
			expect(() => builder.done()).toThrow(
				'FieldBuilder.done() called in standalone mode',
			);
		});

		test('done() should return parent when in inline mode', () => {
			const parent = { marker: 'parent' };
			const builder = new FieldBuilder('name', 'text', parent);
			expect(builder.done()).toBe(parent);
		});

		test('getKey() should return the field key', () => {
			const builder = new FieldBuilder('myField', 'text');
			expect(builder.getKey()).toBe('myField');
		});
	});
});
