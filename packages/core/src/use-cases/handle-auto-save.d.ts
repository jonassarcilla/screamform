import type { FieldState } from './types';
import type { UISchema } from '../domain/schema/types';
export interface AutoSaveResult {
	shouldSave: boolean;
	payload: Record<string, unknown>;
}
/**
 * THE PROTECTOR: Determines what data is safe and mature enough for a draft save.
 */
export declare const handleAutoSave: (
	schema: UISchema,
	rawData: Record<string, unknown>,
) => AutoSaveResult;
/**
 * Helper to handle nested itemSchema auto-saves.
 * Recursively extracts visible, non-error values from FieldState children.
 * Exported for tests to cover single-object branch (lines 91-92).
 */
export declare function extractRecursiveAutoSave(
	field: FieldState,
): Record<string, unknown> | Record<string, unknown>[] | unknown;
//# sourceMappingURL=handle-auto-save.d.ts.map
