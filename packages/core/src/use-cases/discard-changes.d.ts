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
export declare const discardChanges: (
	schema: UISchema,
	currentData: Record<string, unknown>,
	committedData: Record<string, unknown>,
	targetKey?: string,
) => DiscardResult;
//# sourceMappingURL=discard-changes.d.ts.map
