import type {
	Condition,
	LogicGroup,
	LogicValue,
	RuleEffect,
	FieldRule,
} from '../domain/schema/types';

/**
 * Tuple format for concise condition definitions:
 * [field, operator, value?]
 */
export type ConditionTuple = [
	field: string,
	operator: Condition['operator'],
	value?: LogicValue | LogicValue[],
];

/**
 * Converts a single tuple to a Condition object.
 */
export const tupleToCondition = (tuple: ConditionTuple): Condition => ({
	field: tuple[0],
	operator: tuple[1],
	...(tuple[2] !== undefined && { value: tuple[2] }),
});

/**
 * Converts an array of tuples into a LogicGroup with the given operator.
 */
export const tuplesToLogicGroup = (
	tuples: ConditionTuple[],
	operator: 'and' | 'or',
): LogicGroup => ({
	operator,
	conditions: tuples.map(tupleToCondition),
});

/**
 * Creates a FieldRule from a single condition tuple.
 */
export const tupleToRule = (
	effect: RuleEffect,
	tuple: ConditionTuple,
): FieldRule => ({
	effect,
	condition: tupleToCondition(tuple),
});

/**
 * Creates a FieldRule from multiple tuples joined by AND or OR.
 */
export const tuplesToRule = (
	effect: RuleEffect,
	tuples: ConditionTuple[],
	operator: 'and' | 'or',
): FieldRule => ({
	effect,
	condition: tuplesToLogicGroup(tuples, operator),
});
