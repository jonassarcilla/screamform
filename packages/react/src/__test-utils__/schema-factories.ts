import type { UISchema, UISchemaField } from '@screamform/core';

// ---------------------------------------------------------------------------
// Field factories
// ---------------------------------------------------------------------------

export function makeTextField(
	overrides: Partial<UISchemaField> = {},
): UISchemaField {
	return {
		label: 'Text Field',
		widget: 'text',
		...overrides,
	};
}

export function makeRequiredTextField(
	label: string,
	errorMessage = 'This field is required',
	overrides: Partial<UISchemaField> = {},
): UISchemaField {
	return makeTextField({
		label,
		validation: { type: 'required', errorMessage },
		...overrides,
	});
}

export function makeSelectField(
	options: Array<{ label: string; value: string }>,
	overrides: Partial<UISchemaField> = {},
): UISchemaField {
	return {
		label: 'Select Field',
		widget: 'select',
		options,
		...overrides,
	};
}

export function makeSectionField(
	label: string,
	itemSchema: Record<string, UISchemaField>,
	overrides: Partial<UISchemaField> = {},
): UISchemaField {
	return {
		label,
		widget: 'section',
		itemSchema,
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Schema factories
// ---------------------------------------------------------------------------

/**
 * Build a complete UISchema from a field map.
 */
export function makeSchema(
	fields: Record<string, UISchemaField>,
	extra: Partial<UISchema> = {},
): UISchema {
	return { fields, ...extra };
}

/**
 * Two required text fields — reproduces the regression scenario
 * where the second field's validation error persists after typing.
 */
export function makeTwoRequiredFieldsSchema(): UISchema {
	return makeSchema({
		fullName: makeRequiredTextField('Full Name', 'Full Name is required'),
		email: makeRequiredTextField('Email', 'Email is required'),
	});
}

/**
 * Schema with a field that has a defaultValue in the schema definition.
 */
export function makeDefaultValueSchema(): UISchema {
	return makeSchema({
		city: makeTextField({ label: 'City', defaultValue: 'Calamba' }),
		country: makeTextField({ label: 'Country', defaultValue: 'Philippines' }),
		nickname: makeTextField({ label: 'Nickname' }),
	});
}

/**
 * Schema with a section field containing nested children.
 */
export function makeSectionSchema(): UISchema {
	return makeSchema({
		username: makeTextField({ label: 'Username' }),
		contactInfo: makeSectionField('Contact Info', {
			phone: makeTextField({ label: 'Phone' }),
			website: makeTextField({ label: 'Website' }),
		}),
	});
}

/**
 * Schema with a hidden field (HIDE rule always true).
 */
export function makeHiddenFieldSchema(): UISchema {
	return makeSchema({
		visible: makeTextField({ label: 'Visible Field' }),
		hidden: makeTextField({
			label: 'Hidden Field',
			rules: {
				effect: 'HIDE',
				condition: { field: 'visible', operator: 'empty' },
			},
		}),
	});
}

/**
 * Schema with autoSave: false on one field (manual commit).
 */
export function makeManualCommitSchema(): UISchema {
	return makeSchema({
		autoField: makeTextField({ label: 'Auto Field' }),
		manualField: makeTextField({
			label: 'Manual Field',
			autoSave: false,
		}),
	});
}
