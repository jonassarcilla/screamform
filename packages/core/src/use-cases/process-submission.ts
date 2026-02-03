import type { FieldState } from './types';
import type { UISchema, PrimitiveType } from '../domain/schema/types';
import { getFieldState } from './get-field-state';

const PRIMITIVE_TYPES: PrimitiveType[] = [
	'string',
	'number',
	'boolean',
	'date',
	'code',
];

function isPrimitiveType(s: string | undefined): s is PrimitiveType {
	return s !== undefined && PRIMITIVE_TYPES.includes(s as PrimitiveType);
}

/**
 * Default dataType when schema does not set field.dataType.
 * Aligns with sanitizer/capture-input widget coercion.
 */
function getDefaultDataTypeForWidget(widget: string): PrimitiveType {
	switch (widget) {
		case 'number-input':
		case 'number':
		case 'slider':
			return 'number';
		case 'checkbox':
		case 'switch':
			return 'boolean';
		case 'date':
		case 'date-picker':
			return 'date';
		default:
			return 'string';
	}
}

/**
 * Cast a leaf value to the expected primitive for the payload.
 * Empty string / NaN for number → 0 (match sanitizer). code → string.
 */
function castValueByDataType(value: unknown, dataType: PrimitiveType): unknown {
	if (value === null || value === undefined) {
		return value;
	}
	// Arrays/objects (multi-select, tags, etc.) are not cast by primitive type
	if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
		return value;
	}
	switch (dataType) {
		case 'number': {
			const n =
				typeof value === 'string' ? Number.parseFloat(value) : Number(value);
			return Number.isNaN(n) ? 0 : n;
		}
		case 'boolean':
			return Boolean(value);
		case 'date':
			return typeof value === 'string' ? value : String(value);
		case 'string':
		case 'code':
			return String(value);
		default:
			return String(value);
	}
}

/**
 * The final payload contract.
 */
export interface SubmissionResult {
	success: boolean;
	data: Record<string, unknown> | null;
	errors: Record<string, string> | null;
}

/**
 * THE FINALIZER: Prepares data for persistence.
 * This function is the "Exit-Gate" for the core package.
 */
export const processSubmission = (
	schema: UISchema,
	rawData: Record<string, unknown>,
	configData: Record<string, unknown> = {},
): SubmissionResult => {
	// 1. Get the current state (Visibility + Validation)
	const state = getFieldState(schema, rawData, configData);

	// 2. Failure Path: Collect errors only from visible fields
	if (!state.isValid) {
		const errors: Record<string, string> = {};
		Object.entries(state.fields).forEach(([key, field]) => {
			if (field.isVisible && field.error) {
				errors[key] = field.error;
			}
		});
		return { success: false, data: null, errors };
	}

	// 3. Success Path: Extract data while respecting Security/Privacy
	const excludeKeys = new Set(schema.exclude || []);
	const finalData = extractCleanData(state.fields, excludeKeys);

	return {
		success: true,
		data: finalData,
		errors: null,
	};
};

/**
 * HELPER: Recursively extracts values only for visible/non-excluded fields.
 * Eliminates 'any' by using strictly defined FieldState and Record types.
 */
function extractCleanData(
	fields: Record<string, FieldState>,
	excludeKeys: Set<string>,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const [key, field] of Object.entries(fields)) {
		// SECURITY: If field is hidden or explicitly excluded, it never enters the persistence layer.
		if (!field.isVisible || excludeKeys.has(key)) {
			continue;
		}

		// Handle Nesting (itemSchema children)
		if (field.children) {
			if (Array.isArray(field.children)) {
				// Handle Array of Objects
				result[key] = field.children.map((childGroup) =>
					extractCleanData(childGroup, excludeKeys),
				);
			} else {
				// Handle Single Nested Object
				result[key] = extractCleanData(field.children, excludeKeys);
			}
		} else {
			// Leaf node: cast by dataType (explicit or widget default)
			const effectiveDataType: PrimitiveType = isPrimitiveType(field.dataType)
				? field.dataType
				: getDefaultDataTypeForWidget(field.widget);
			result[key] = castValueByDataType(field.value, effectiveDataType);
		}
	}

	return result;
}
