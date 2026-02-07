import type { UISchemaField } from '../domain/schema/types';
export interface CaptureResult<T = unknown> {
	value: T;
	key: string;
}
/**
 * THE CAPTURED: Processes raw UI events with zero 'any' usage.
 * Uses Generics to ensure the returned value matches the expected type.
 */
export declare const captureInput: <T = unknown>(
	key: string,
	rawValue: unknown, // Changed from 'any' to 'unknown'
	oldValue: T, // Use Generic T
	fieldSchema: UISchemaField,
	options?: {
		isDebug?: boolean;
	},
) => CaptureResult<T>;
//# sourceMappingURL=capture-input.d.ts.map
