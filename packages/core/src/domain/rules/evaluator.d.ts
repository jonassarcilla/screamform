import type { Condition, LogicGroup } from '../schema/types';
/**
 * The Recursive Brain: Resolves logic trees without 'any'.
 * Ensures type-strict comparisons to maintain Processing Integrity.
 */
export declare const evaluateLogic: (
	logic: LogicGroup | Condition,
	data: Record<string, unknown>,
) => boolean;
//# sourceMappingURL=evaluator.d.ts.map
