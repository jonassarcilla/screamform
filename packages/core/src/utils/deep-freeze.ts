/**
 * Recursively freezes an object and all its nested properties.
 * Prevents runtime mutation of generated schemas.
 *
 * @returns The same object, deeply frozen.
 */
export const deepFreeze = <T extends object>(obj: T): Readonly<T> => {
	Object.freeze(obj);

	for (const value of Object.values(obj)) {
		if (
			value !== null &&
			typeof value === 'object' &&
			!Object.isFrozen(value)
		) {
			deepFreeze(value);
		}
	}

	return obj;
};
