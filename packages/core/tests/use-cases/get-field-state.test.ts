import { getFieldState } from '@screamform/core';
import type { UISchema } from '@screamform/core/domain/schema/types';
import { describe, test, expect } from 'bun:test';

describe('Use Case: getFieldState', () => {
	const mockSchema: UISchema = {
		fields: {
			firstName: {
				label: 'First Name',
				widget: 'text',
				validation: { type: 'required', errorMessage: 'Name is required' },
			},
			showSecret: {
				label: 'Show Secret?',
				widget: 'checkbox',
			},
			secretCode: {
				label: 'Secret Code',
				widget: 'text',
				rules: {
					effect: 'SHOW',
					condition: { field: 'showSecret', operator: '===', value: true },
				},
			},
		},
	};

	test('should calculate initial state correctly', () => {
		const rawData = { firstName: '', showSecret: false };
		const state = getFieldState(mockSchema, rawData);

		const firstName = state.fields.firstName;
		const secretCode = state.fields.secretCode;
		expect(firstName).toBeDefined();
		expect(secretCode).toBeDefined();
		expect(firstName?.error).toBe('Name is required');
		expect(secretCode?.isVisible).toBe(false);
		expect(state.isValid).toBe(false);
	});

	test('should dynamically show fields based on rules', () => {
		const rawData = { firstName: 'Gemini', showSecret: true };
		const state = getFieldState(mockSchema, rawData);

		const secretCode = state.fields.secretCode;
		expect(secretCode).toBeDefined();
		expect(secretCode?.isVisible).toBe(true);
		expect(state.isValid).toBe(true);
	});

	test('should handle nested itemSchema recursion', () => {
		const nestedSchema: UISchema = {
			fields: {
				address: {
					label: 'Address',
					widget: 'object',
					itemSchema: {
						city: { label: 'City', widget: 'text' },
						zip: { label: 'Zip', widget: 'number-input' },
					},
				},
			},
		};

		const rawData = {
			address: { city: 'New York', zip: '10001' },
		};

		const state = getFieldState(nestedSchema, rawData);

		const address = state.fields.address;
		expect(address).toBeDefined();
		expect(address?.children).toBeDefined();
		const children = address?.children as
			| Record<string, { value: unknown }>
			| undefined;
		expect(children?.city?.value).toBe('New York');
		expect(children?.zip?.value).toBe('10001');
	});

	test('should resolve templates', () => {
		const templateSchema: UISchema = {
			fields: {
				firstName: { label: 'First', widget: 'text' },
				lastName: { label: 'Last', widget: 'text' },
				fullName: {
					label: 'Full Name',
					widget: 'text',
					template: '{{firstName}} {{lastName}}',
				},
			},
		};

		const rawData = { firstName: 'John', lastName: 'Doe' };
		const state = getFieldState(templateSchema, rawData);

		const fullName = state.fields.fullName;
		expect(fullName).toBeDefined();
		expect(fullName?.value).toBe('John Doe');
	});

	test('should resolve template with missing path to empty string', () => {
		const schema: UISchema = {
			fields: {
				a: { label: 'A', widget: 'text' },
				combined: {
					label: 'Combined',
					widget: 'text',
					template: '{{a}} {{missing}}',
				},
			},
		};
		const state = getFieldState(schema, { a: 'x' });
		expect(state.fields.combined?.value).toBe('x ');
	});

	test('HIDE effect sets isVisible false', () => {
		const schema: UISchema = {
			fields: {
				toggle: { label: 'Toggle', widget: 'checkbox' },
				hidden: {
					label: 'Hidden',
					widget: 'text',
					rules: {
						effect: 'HIDE',
						condition: { field: 'toggle', operator: '===', value: true },
					},
				},
			},
		};
		const state = getFieldState(schema, { toggle: true });
		expect(state.fields.hidden?.isVisible).toBe(false);
	});

	test('DISABLE effect sets isDisabled true', () => {
		const schema: UISchema = {
			fields: {
				flag: { label: 'Flag', widget: 'checkbox' },
				disabled: {
					label: 'Disabled',
					widget: 'text',
					rules: {
						effect: 'DISABLE',
						condition: { field: 'flag', operator: '===', value: true },
					},
				},
			},
		};
		const state = getFieldState(schema, { flag: true });
		expect(state.fields.disabled?.isDisabled).toBe(true);
	});

	test('REQUIRE effect sets isRequired true', () => {
		const schema: UISchema = {
			fields: {
				mode: { label: 'Mode', widget: 'text' },
				required: {
					label: 'Required',
					widget: 'text',
					rules: {
						effect: 'REQUIRE',
						condition: { field: 'mode', operator: '===', value: 'strict' },
					},
				},
			},
		};
		const state = getFieldState(schema, { mode: 'strict', required: '' });
		expect(state.fields.required?.isRequired).toBe(true);
		expect(state.fields.required?.error).toBe('This field is required');
	});

	test('OPTIONAL effect sets isRequired false', () => {
		const schema: UISchema = {
			fields: {
				mode: { label: 'Mode', widget: 'text' },
				optional: {
					label: 'Optional',
					widget: 'text',
					validation: { type: 'required', errorMessage: 'Required' },
					rules: {
						effect: 'OPTIONAL',
						condition: { field: 'mode', operator: '===', value: 'draft' },
					},
				},
			},
		};
		const state = getFieldState(schema, { mode: 'draft', optional: '' });
		expect(state.fields.optional?.isRequired).toBe(false);
		expect(state.fields.optional?.error).toBe(null);
	});

	test('itemSchema with array value produces children array', () => {
		const schema: UISchema = {
			fields: {
				items: {
					label: 'Items',
					widget: 'object',
					itemSchema: {
						name: { label: 'Name', widget: 'text' },
					},
				},
			},
		};
		const rawData = {
			items: [{ name: 'First' }, { name: 'Second' }],
		};
		const state = getFieldState(schema, rawData);
		const items = state.fields.items;
		expect(items).toBeDefined();
		expect(Array.isArray(items?.children)).toBe(true);
		const arr = items?.children as Record<string, { value: unknown }>[];
		expect(arr).toHaveLength(2);
		expect(arr[0]?.name?.value).toBe('First');
		expect(arr[1]?.name?.value).toBe('Second');
	});

	test('itemSchema with null value uses empty object for nested', () => {
		const schema: UISchema = {
			fields: {
				address: {
					label: 'Address',
					widget: 'object',
					itemSchema: {
						city: { label: 'City', widget: 'text' },
					},
				},
			},
		};
		const state = getFieldState(schema, { address: null });
		const address = state.fields.address;
		expect(address?.children).toBeDefined();
	});

	test('itemSchema array with non-object item uses empty object for that slot', () => {
		const schema: UISchema = {
			fields: {
				items: {
					label: 'Items',
					widget: 'object',
					itemSchema: {
						name: { label: 'Name', widget: 'text' },
					},
				},
			},
		};
		const rawData = { items: [{ name: 'OK' }, null, 42] };
		const state = getFieldState(schema, rawData);
		const items = state.fields.items;
		expect(items?.children).toBeDefined();
		const arr = items?.children as Record<string, { value: unknown }>[];
		expect(arr).toHaveLength(3);
		expect(arr[0]?.name?.value).toBe('OK');
		expect(arr[1]).toBeDefined();
		expect(arr[2]).toBeDefined();
	});

	test('multiple rules as array are all evaluated', () => {
		const schema: UISchema = {
			fields: {
				a: { label: 'A', widget: 'text' },
				b: { label: 'B', widget: 'text' },
				revealed: {
					label: 'Revealed',
					widget: 'text',
					rules: [
						{
							effect: 'SHOW',
							condition: { field: 'a', operator: '===', value: '1' },
						},
						{
							effect: 'DISABLE',
							condition: { field: 'b', operator: '===', value: '0' },
						},
					],
				},
			},
		};
		const state = getFieldState(schema, { a: '1', b: '0' });
		expect(state.fields.revealed?.isVisible).toBe(true);
		expect(state.fields.revealed?.isDisabled).toBe(true);
	});

	test('field with no rules has calculateEffects early return', () => {
		const schema: UISchema = {
			fields: {
				simple: { label: 'Simple', widget: 'text' },
			},
		};
		const state = getFieldState(schema, { simple: 'x' });
		expect(state.fields.simple?.isVisible).toBe(true);
		expect(state.fields.simple?.isDisabled).toBe(false);
	});

	test('checkIsRequired with nested validation group', () => {
		const schema: UISchema = {
			fields: {
				name: {
					label: 'Name',
					widget: 'text',
					validation: {
						operator: 'and',
						rules: [{ type: 'required', errorMessage: 'Required' }],
					},
				},
			},
		};
		const state = getFieldState(schema, { name: '' });
		expect(state.fields.name?.isRequired).toBe(true);
		expect(state.fields.name?.error).toBe('Required');
	});

	test('widget date uses default dataType date when dataType not set', () => {
		const schema: UISchema = {
			fields: {
				birthday: { label: 'Birthday', widget: 'date' },
			},
		};
		const state = getFieldState(schema, { birthday: '2024-01-15' });
		expect(state.fields.birthday?.dataType).toBe('date');
	});

	test('widget date-picker uses default dataType date when dataType not set', () => {
		const schema: UISchema = {
			fields: {
				start: { label: 'Start', widget: 'date-picker' },
			},
		};
		const state = getFieldState(schema, { start: '2024-06-01' });
		expect(state.fields.start?.dataType).toBe('date');
	});

	test('configData supplies value when rawData has null/undefined for field', () => {
		const schema: UISchema = {
			fields: {
				bound: { label: 'Bound', widget: 'text', bindPath: 'bound' },
			},
		};
		const state = getFieldState(schema, {}, { bound: 'from-config' });
		expect(state.fields.bound?.value).toBe('from-config');
	});

	test('field.defaultValue is used when value is null/undefined and no configValue', () => {
		const schema: UISchema = {
			fields: {
				username: {
					label: 'Username',
					widget: 'text',
					defaultValue: 'guest',
				},
			},
		};
		const state = getFieldState(schema, {});
		expect(state.fields.username?.value).toBe('guest');
	});

	test('widget number uses default dataType number when dataType not set', () => {
		const schema: UISchema = {
			fields: {
				score: { label: 'Score', widget: 'number' },
			},
		};
		const state = getFieldState(schema, { score: 10 });
		expect(state.fields.score?.dataType).toBe('number');
	});

	test('widget slider uses default dataType number when dataType not set', () => {
		const schema: UISchema = {
			fields: {
				vol: { label: 'Volume', widget: 'slider' },
			},
		};
		const state = getFieldState(schema, { vol: 50 });
		expect(state.fields.vol?.dataType).toBe('number');
	});

	test('value starting with = sets dataType to code', () => {
		const schema: UISchema = {
			fields: {
				formula: { label: 'Formula', widget: 'text' },
			},
		};
		const state = getFieldState(schema, { formula: '=A1+B1' });
		expect(state.fields.formula?.dataType).toBe('code');
		expect(state.fields.formula?.value).toBe('=A1+B1');
	});

	test('accepts options.isDebug for logger', () => {
		const schema: UISchema = {
			fields: { x: { label: 'X', widget: 'text' } },
		};
		const state = getFieldState(schema, { x: 'y' }, {}, { isDebug: true });
		expect(state.fields.x?.value).toBe('y');
	});

	test('logger.debug runs with visibleWithError when isDebug true and there are visible errors', () => {
		const schema: UISchema = {
			fields: {
				name: {
					label: 'Name',
					widget: 'text',
					validation: { type: 'required', errorMessage: 'Name is required' },
				},
			},
		};
		const state = getFieldState(schema, { name: '' }, {}, { isDebug: true });
		expect(state.fields.name?.isVisible).toBe(true);
		expect(state.fields.name?.error).toBe('Name is required');
		expect(state.isValid).toBe(false);
	});

	test('uiProps.label, placeholder, description override top-level field values', () => {
		const schema: UISchema = {
			fields: {
				x: {
					label: 'Default Label',
					placeholder: 'Default placeholder',
					description: 'Default description',
					widget: 'text',
					uiProps: {
						label: 'Override Label',
						placeholder: 'Override placeholder',
						description: 'Override description',
					},
				},
			},
		};
		const state = getFieldState(schema, { x: '' });
		expect(state.fields.x?.label).toBe('Override Label');
		expect(state.fields.x?.placeholder).toBe('Override placeholder');
		expect(state.fields.x?.description).toBe('Override description');
	});

	test('when uiProps has no label, placeholder, description state uses top-level field values', () => {
		const schema: UISchema = {
			fields: {
				y: {
					label: 'Only Label',
					placeholder: 'Only placeholder',
					description: 'Only description',
					widget: 'text',
				},
			},
		};
		const state = getFieldState(schema, { y: '' });
		expect(state.fields.y?.label).toBe('Only Label');
		expect(state.fields.y?.placeholder).toBe('Only placeholder');
		expect(state.fields.y?.description).toBe('Only description');
	});

	test('placeholder falls back to empty string when neither field nor uiProps set', () => {
		const schema: UISchema = {
			fields: {
				z: { label: 'Z', widget: 'text' },
			},
		};
		const state = getFieldState(schema, { z: '' });
		expect(state.fields.z?.placeholder).toBe('');
	});
});
