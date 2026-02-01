/**
 * THE PATHMASTER: Handles nested data access and creation
 */
export const PathResolver = {
	/**
	 * Reaches into an object using "user.firstName" strings.
	 */
	get: (obj: Record<string, unknown>, path: string): unknown => {
		if (!path) return undefined;
		return path.split('.').reduce<unknown>((acc, part) => {
			if (
				acc &&
				typeof acc === 'object' &&
				part in (acc as Record<string, unknown>)
			) {
				return (acc as Record<string, unknown>)[part];
			}
			return undefined;
		}, obj);
	},

	/**
	 * Creates or updates nested structures.
	 * If "contacts.address" doesn't exist, it creates it.
	 */
	set: (
		obj: Record<string, unknown>,
		path: string,
		value: unknown,
	): Record<string, unknown> => {
		const root = { ...obj };
		const keys = path.split('.');
		let current: Record<string, unknown> = root;

		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i];
			if (!key) continue;

			if (!(key in current) || typeof current[key] !== 'object') {
				current[key] = {};
			} else {
				current[key] = { ...(current[key] as Record<string, unknown>) };
			}
			current = current[key] as Record<string, unknown>;
		}

		const lastKey = keys[keys.length - 1];
		if (lastKey) {
			current[lastKey] = value;
		}
		return root;
	},
};
