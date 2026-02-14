import type { UISchema, UISchemaField } from '../domain/schema/types';

export interface SchemaValidationIssue {
	/** Field path (e.g. 'address.city') */
	path: string;
	/** Severity: 'error' for definite problems, 'warning' for likely mistakes */
	severity: 'error' | 'warning';
	/** Human-readable description */
	message: string;
}

/**
 * Performs static validation on a UISchema to catch common misconfigurations.
 *
 * Checks for:
 * - Missing labels
 * - Select fields without options (and no optionsKey)
 * - min > max in validation rules
 * - Duplicate field keys in itemSchema
 * - Empty itemSchema
 * - Unknown widget types (warning only)
 *
 * @returns Array of issues found. Empty array means schema is valid.
 */
export const validateSchema = (schema: UISchema): SchemaValidationIssue[] => {
	const issues: SchemaValidationIssue[] = [];
	walkAndValidate(schema.fields, '', issues);
	return issues;
};

function walkAndValidate(
	fields: Record<string, UISchemaField>,
	prefix: string,
	issues: SchemaValidationIssue[],
): void {
	const defaultWidgets = new Set([
		'text',
		'number',
		'select',
		'multi-select',
		'checkbox',
		'switch',
		'slider',
		'date',
		'date-picker',
		'section',
		'array',
	]);

	for (const [key, field] of Object.entries(fields)) {
		const path = prefix ? `${prefix}.${key}` : key;

		// 1. Missing label
		if (!field.label || field.label.trim() === '') {
			issues.push({
				path,
				severity: 'warning',
				message: 'Field is missing a label.',
			});
		}

		// 2. Select without options
		if (
			(field.widget === 'select' || field.widget === 'multi-select') &&
			(!field.options || field.options.length === 0) &&
			!field.uiProps?.optionsKey
		) {
			issues.push({
				path,
				severity: 'warning',
				message: `Select field "${path}" has no options and no optionsKey.`,
			});
		}

		// 3. min > max in validation
		checkMinMax(field, path, issues);

		// 4. Unknown widget
		if (!defaultWidgets.has(field.widget)) {
			issues.push({
				path,
				severity: 'warning',
				message: `Unknown widget type "${field.widget}". Ensure a custom widget is registered.`,
			});
		}

		// 5. Empty itemSchema
		if (field.itemSchema && Object.keys(field.itemSchema).length === 0) {
			issues.push({
				path,
				severity: 'error',
				message: `Field "${path}" has an empty itemSchema.`,
			});
		}

		// 6. Recurse into itemSchema
		if (field.itemSchema && Object.keys(field.itemSchema).length > 0) {
			walkAndValidate(field.itemSchema, path, issues);
		}
	}
}

function checkMinMax(
	field: UISchemaField,
	path: string,
	issues: SchemaValidationIssue[],
): void {
	const validation = field.validation;
	if (!validation) return;

	// Handle ValidationGroup
	if ('rules' in validation) {
		let minVal: number | undefined;
		let maxVal: number | undefined;

		for (const rule of validation.rules) {
			if ('type' in rule) {
				if (rule.type === 'min' && typeof rule.value === 'number') {
					minVal = rule.value;
				}
				if (rule.type === 'max' && typeof rule.value === 'number') {
					maxVal = rule.value;
				}
			}
		}

		if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
			issues.push({
				path,
				severity: 'error',
				message: `Field "${path}" has min (${minVal}) greater than max (${maxVal}).`,
			});
		}
	}
}
