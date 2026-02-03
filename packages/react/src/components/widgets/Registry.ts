import type { ComponentType } from 'react';
import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';
import { SelectInput } from './SelectInput';
import type { FieldState, LogicValue } from '@screamform/core';

/**
 * The "Contract": All widgets receive the full FieldState
 * plus the functional triggers from the React layer.
 */
export interface WidgetProps extends FieldState {
	fieldKey?: string;
	onChange: (val: LogicValue) => void;
	onCommit?: (val: LogicValue) => void;
	autoSave?: boolean;
	testId?: string;
}

/**
 * Ensures the Registry components are strictly compatible with WidgetProps.
 * We avoid 'any' here to maintain strong type safety across the package.
 */
export type WidgetRegistry = Record<string, ComponentType<WidgetProps>>;

/**
 * 2. Map the keys to the actual Components.
 * The keys here should match the 'widget' string in your JSON schema.
 */
export const DefaultWidgets: WidgetRegistry = {
	text: TextInput as ComponentType<WidgetProps>,
	number: NumberInput as ComponentType<WidgetProps>,
	select: SelectInput as ComponentType<WidgetProps>,
	'multi-select': SelectInput as ComponentType<WidgetProps>,
	// switch: BooleanInput as ComponentType<WidgetProps>,
};
