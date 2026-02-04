import type { FieldState } from './types';
import type { UISchema } from '../domain/schema/types';
import { getFieldState } from './get-field-state';

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
			// Leaf node: pass through value as-is; caller may cast as long as it is valid
			result[key] = field.value;
		}
	}

	return result;
}
