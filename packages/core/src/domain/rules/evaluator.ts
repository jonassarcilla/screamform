import type { Condition, LogicGroup, LogicValue } from '../schema/types';

const isNumber = (val: unknown): val is number => typeof val === 'number';
const isString = (val: unknown): val is string => typeof val === 'string';
const isBoolean = (val: unknown): val is boolean => typeof val === 'boolean';

/**
 * The Recursive Brain: Resolves logic trees without 'any'.
 * Ensures type-strict comparisons to maintain Processing Integrity.
 */
export const evaluateLogic = (
	logic: LogicGroup | Condition,
	data: Record<string, unknown>,
): boolean => {
	// --- BASE CASE: Single Leaf Condition ---
	if ('field' in logic) {
		const val = data[logic.field];
		const compare = logic.value;

		switch (logic.operator) {
			case '===':
				return val === compare;
			case '!==':
				return val !== compare;

			case '>':
				return isNumber(val) && isNumber(compare) && val > compare;
			case '<':
				return isNumber(val) && isNumber(compare) && val < compare;
			case '>=':
				return isNumber(val) && isNumber(compare) && val >= compare;
			case '<=':
				return isNumber(val) && isNumber(compare) && val <= compare;

			case 'startsWith':
				return isString(val) && isString(compare) && val.startsWith(compare);
			case 'endsWith':
				return isString(val) && isString(compare) && val.endsWith(compare);

			case 'contains':
				return Array.isArray(val) && val.includes(compare as LogicValue);
			case 'in':
				return Array.isArray(compare) && compare.includes(val as LogicValue);

			case 'empty':
				// SOC 2 Integrity: Booleans (true/false) are valid data and NEVER "empty"
				if (isBoolean(val)) return false;
				return (
					val === null ||
					val === undefined ||
					val === '' ||
					(Array.isArray(val) && val.length === 0)
				);

			default:
				return false;
		}
	}

	// --- RECURSIVE CASE: Logic Group Branch ---
	const results = logic.conditions.map((c) => evaluateLogic(c, data));

	switch (logic.operator) {
		case 'and':
			return results.every((v) => v === true);
		case 'or':
			return results.some((v) => v === true);
		case 'not':
			return !results[0]; // Negates the first condition in the group
		default:
			return true;
	}
};
