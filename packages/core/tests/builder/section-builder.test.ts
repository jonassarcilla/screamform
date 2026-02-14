import { describe, test, expect } from 'bun:test';
import { SectionBuilder } from '@screamform/core/builder/section-builder';

describe('Builder: SectionBuilder', () => {
	describe('basic properties', () => {
		test('should build a minimal section', () => {
			const { key, field } = new SectionBuilder('address').build();
			expect(key).toBe('address');
			expect(field.widget).toBe('section');
			expect(field.label).toBe('address'); // defaults to key
		});

		test('should set label', () => {
			const { field } = new SectionBuilder('address')
				.withLabel('Address')
				.build();
			expect(field.label).toBe('Address');
		});

		test('should set description', () => {
			const { field } = new SectionBuilder('address')
				.description('Your mailing address')
				.build();
			expect(field.description).toBe('Your mailing address');
		});

		test('should set sensitivity', () => {
			const { field } = new SectionBuilder('personal')
				.sensitivity('pii')
				.build();
			expect(field.sensitivity).toBe('pii');
		});

		test('should set defaultValue', () => {
			const { field } = new SectionBuilder('prefs').defaultValue(null).build();
			expect(field.defaultValue).toBeNull();
		});

		test('should set bindPath', () => {
			const { field } = new SectionBuilder('addr')
				.bindPath('user.address')
				.build();
			expect(field.bindPath).toBe('user.address');
		});

		test('should set uiProps', () => {
			const { field } = new SectionBuilder('section')
				.uiProps({ maxItems: 10 })
				.build();
			expect(field.uiProps?.maxItems).toBe(10);
		});

		test('should set validation', () => {
			const { field } = new SectionBuilder('section')
				.validation({ type: 'required', errorMessage: 'Section is required' })
				.build();
			expect(field.validation).toBeDefined();
		});
	});

	describe('child fields', () => {
		test('should add text field children', () => {
			const { field } = new SectionBuilder('address')
				.addTextField('city')
				.withLabel('City')
				.done()
				.addTextField('zip')
				.withLabel('Zip')
				.done()
				.build();

			expect(field.itemSchema).toBeDefined();
			expect(field.itemSchema?.city).toBeDefined();
			expect(field.itemSchema?.city.label).toBe('City');
			expect(field.itemSchema?.zip).toBeDefined();
			expect(field.itemSchema?.zip.label).toBe('Zip');
		});

		test('should add number field children', () => {
			const { field } = new SectionBuilder('metrics')
				.addNumberField('count')
				.withLabel('Count')
				.done()
				.build();

			expect(field.itemSchema?.count.widget).toBe('number');
		});

		test('should add select field children', () => {
			const { field } = new SectionBuilder('prefs')
				.addSelectField('theme')
				.withLabel('Theme')
				.withOptions([
					{ label: 'Light', value: 'light' },
					{ label: 'Dark', value: 'dark' },
				])
				.done()
				.build();

			expect(field.itemSchema?.theme.widget).toBe('select');
			expect(field.itemSchema?.theme.options).toHaveLength(2);
		});

		test('should add checkbox field children', () => {
			const { field } = new SectionBuilder('settings')
				.addCheckboxField('agree')
				.withLabel('Agree')
				.done()
				.build();

			expect(field.itemSchema?.agree.widget).toBe('checkbox');
		});

		test('should add custom widget field children', () => {
			const { field } = new SectionBuilder('extra')
				.addCustomField('rating', 'rating')
				.withLabel('Rating')
				.done()
				.build();

			expect(field.itemSchema?.rating.widget).toBe('rating');
		});

		test('should add pre-built field via addField', () => {
			const { field } = new SectionBuilder('section')
				.addField('name', {
					label: 'Name',
					widget: 'text',
				})
				.build();

			expect(field.itemSchema?.name.label).toBe('Name');
		});
	});

	describe('nested sections', () => {
		test('should support nested sections', () => {
			const { field } = new SectionBuilder('contact')
				.withLabel('Contact Info')
				.addTextField('name')
				.withLabel('Name')
				.done()
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

			expect(field.itemSchema?.name).toBeDefined();
			expect(field.itemSchema?.address).toBeDefined();
			expect(field.itemSchema?.address.widget).toBe('section');
			expect(field.itemSchema?.address.itemSchema?.city.label).toBe('City');
			expect(field.itemSchema?.address.itemSchema?.zip.label).toBe('Zip');
		});
	});

	describe('rules', () => {
		test('should add showWhen rule', () => {
			const { field } = new SectionBuilder('details')
				.showWhen('type', '===', 'advanced')
				.build();
			expect(field.rules).toBeDefined();
			expect((field.rules as { effect: string }).effect).toBe('SHOW');
		});

		test('should add hideWhen rule', () => {
			const { field } = new SectionBuilder('details')
				.hideWhen('type', '===', 'simple')
				.build();
			expect((field.rules as { effect: string }).effect).toBe('HIDE');
		});

		test('should add disableWhen rule', () => {
			const { field } = new SectionBuilder('details')
				.disableWhen('locked', '===', true)
				.build();
			expect((field.rules as { effect: string }).effect).toBe('DISABLE');
		});

		test('should add enableWhen rule', () => {
			const { field } = new SectionBuilder('details')
				.enableWhen('editable', '===', true)
				.build();
			expect((field.rules as { effect: string }).effect).toBe('ENABLE');
		});

		test('should add showWhenAll compound rule', () => {
			const { field } = new SectionBuilder('details')
				.showWhenAll([
					['role', '===', 'admin'],
					['active', '===', true],
				])
				.build();
			const rule = field.rules as {
				condition: { operator: string; conditions: unknown[] };
			};
			expect(rule.condition.operator).toBe('and');
		});

		test('should add showWhenAny compound rule', () => {
			const { field } = new SectionBuilder('details')
				.showWhenAny([
					['role', '===', 'admin'],
					['role', '===', 'editor'],
				])
				.build();
			const rule = field.rules as {
				condition: { operator: string };
			};
			expect(rule.condition.operator).toBe('or');
		});

		test('should add hideWhenAll compound rule', () => {
			const { field } = new SectionBuilder('details')
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

		test('should add disableWhenAll compound rule', () => {
			const { field } = new SectionBuilder('details')
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

		test('should add disableWhenAny compound rule', () => {
			const { field } = new SectionBuilder('details')
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

		test('should add rawRules', () => {
			const { field } = new SectionBuilder('details')
				.rawRules({
					effect: 'SHOW',
					condition: {
						operator: 'and',
						conditions: [
							{ field: 'a', operator: '===', value: 1 },
							{ field: 'b', operator: '===', value: 2 },
						],
					},
				})
				.build();
			expect(field.rules).toBeDefined();
		});

		test('should accumulate multiple rules', () => {
			const { field } = new SectionBuilder('details')
				.showWhen('visible', '===', true)
				.disableWhen('locked', '===', true)
				.build();
			expect(Array.isArray(field.rules)).toBe(true);
			expect((field.rules as unknown[]).length).toBe(2);
		});
	});

	describe('done() and standalone mode', () => {
		test('done() should throw in standalone mode', () => {
			const builder = new SectionBuilder('section');
			expect(() => builder.done()).toThrow(
				'SectionBuilder.done() called in standalone mode',
			);
		});

		test('done() should return parent when in inline mode', () => {
			const parent = { marker: 'parent' };
			const builder = new SectionBuilder('section', parent);
			expect(builder.done()).toBe(parent);
		});

		test('getKey() should return the section key', () => {
			const builder = new SectionBuilder('mySection');
			expect(builder.getKey()).toBe('mySection');
		});
	});
});
