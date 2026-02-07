import type { UISchema } from '../domain/schema/types';
import type { FormState } from './types';
export declare const getFieldState: (
	schema: UISchema,
	rawData: Record<string, unknown>,
	configData?: Record<string, unknown>,
	options?: {
		isDebug?: boolean;
	},
) => FormState;
//# sourceMappingURL=get-field-state.d.ts.map
