/**
 * THE PATHMASTER: Handles nested data access and creation
 */
export declare const PathResolver: {
	/**
	 * Reaches into an object using "user.firstName" strings.
	 */
	get: (obj: Record<string, unknown>, path: string) => unknown;
	/**
	 * Creates or updates nested structures.
	 * If "contacts.address" doesn't exist, it creates it.
	 */
	set: (
		obj: Record<string, unknown>,
		path: string,
		value: unknown,
	) => Record<string, unknown>;
};
//# sourceMappingURL=path-resolver.d.ts.map
