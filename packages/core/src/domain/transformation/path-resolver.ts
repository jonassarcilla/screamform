/** Normalize bracket notation: "items[0].name" -> "items.0.name" */
const normalizePath = (path: string): string =>
	path.replace(/\[(\d+)\]/g, '.$1');

/** Check if a string is a numeric index */
const isNumericKey = (key: string): boolean => /^\d+$/.test(key);

/**
 * THE PATHMASTER: Handles nested data access and creation.
 * Supports dot notation ("user.firstName"), numeric indices ("contacts.0.name"),
 * and bracket notation ("contacts[0].name").
 */
export const PathResolver = {
	/**
	 * Reaches into an object/array using path strings.
	 * Supports: "user.firstName", "contacts.0.name", "contacts[0].name"
	 */
	get: (obj: Record<string, unknown>, path: string): unknown => {
		if (!path) return undefined;
		const normalized = normalizePath(path);
		return normalized.split('.').reduce<unknown>((acc, part) => {
			if (acc === null || acc === undefined) return undefined;

			// Array index access
			if (Array.isArray(acc) && isNumericKey(part)) {
				const index = Number(part);
				return index < acc.length ? acc[index] : undefined;
			}

			// Object property access
			if (typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
				return (acc as Record<string, unknown>)[part];
			}

			return undefined;
		}, obj);
	},

	/**
	 * Creates or updates nested structures (objects and arrays).
	 * If "contacts.0.name" is set and contacts doesn't exist, it creates an array.
	 * Does not mutate the original object.
	 */
	set: (
		obj: Record<string, unknown>,
		path: string,
		value: unknown,
	): Record<string, unknown> => {
		const normalized = normalizePath(path);
		const keys = normalized.split('.');
		const root = { ...obj };
		let current: Record<string, unknown> | unknown[] = root;

		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i];
			if (!key) continue;

			const nextKey = keys[i + 1];
			const nextIsNumeric = nextKey !== undefined && isNumericKey(nextKey);

			if (Array.isArray(current)) {
				// Current is an array, key must be numeric
				const index = Number(key);
				if (current[index] === undefined || current[index] === null) {
					current[index] = nextIsNumeric ? [] : {};
				} else if (typeof current[index] === 'object') {
					current[index] = Array.isArray(current[index])
						? [...current[index]]
						: { ...current[index] };
				} else {
					current[index] = nextIsNumeric ? [] : {};
				}
				current = current[index] as Record<string, unknown> | unknown[];
			} else {
				// Current is an object
				if (
					!(key in current) ||
					current[key] === null ||
					current[key] === undefined
				) {
					current[key] = nextIsNumeric ? [] : {};
				} else if (typeof current[key] === 'object') {
					current[key] = Array.isArray(current[key])
						? [...current[key]]
						: { ...current[key] };
				} else {
					current[key] = nextIsNumeric ? [] : {};
				}
				current = current[key] as Record<string, unknown> | unknown[];
			}
		}

		const lastKey = keys[keys.length - 1];
		if (lastKey) {
			if (Array.isArray(current)) {
				const index = Number(lastKey);
				current[index] = value;
			} else {
				current[lastKey] = value;
			}
		}
		return root;
	},
};
