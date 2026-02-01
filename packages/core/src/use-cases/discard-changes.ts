import type { UISchema } from '../domain/schema/types';

export interface DiscardResult {
	data: Record<string, unknown>;
}

/**
 * THE REVERTER: Returns data to the "Last Known Good" or "Default" state.
 * Hierarchy:
 * 1. committedData (The value last saved to the server/baseline)
 * 2. defaultValue (The explicit value set in the UISchema)
 * 3. Fallback (A clean empty state based on widget type)
 */
export const discardChanges = (
	schema: UISchema,
	currentData: Record<string, unknown>,
	committedData: Record<string, unknown>,
	targetKey?: string,
): DiscardResult => {
	// Helper to get the "safest" value for a specific field
	const getSafeValue = (key: string): unknown => {
		const field = schema.fields[key];

		// 1. Return the last committed value if it exists
		if (committedData[key] !== undefined) {
			return committedData[key];
		}

		// 2. Otherwise, return the explicit default from schema
		if (field?.defaultValue !== undefined) {
			return field.defaultValue;
		}

		// 3. Last resort: Type-safe fallback
		return getFallbackValue(field?.widget || 'text');
	};

	// Case A: Discarding a single specific field
	if (targetKey) {
		return {
			data: {
				...currentData,
				[targetKey]: getSafeValue(targetKey),
			},
		};
	}

	// Case B: Discarding the entire form (Reset to Baseline)
	const restoredData: Record<string, unknown> = {};
	for (const key of Object.keys(schema.fields)) {
		restoredData[key] = getSafeValue(key);
	}

	return { data: restoredData };
};

/**
 * Ensures we don't return 'undefined' which can break React inputs
 */
function getFallbackValue(widget: string): unknown {
	const fallbacks: Record<string, unknown> = {
		checkbox: false,
		'multi-select': [],
		object: {},
		number: 0,
	};
	return fallbacks[widget] ?? '';
}
