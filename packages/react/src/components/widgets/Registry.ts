import type { ComponentType } from 'react';
import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';

export type FieldValue =
	| string
	| number
	| boolean
	| string[]
	| number[]
	| null
	| undefined;

// 1. Define the "Contract" (Props all widgets must follow)
export interface WidgetProps<T extends FieldValue = FieldValue> {
	fieldKey: string;
	value: T;
	onChange: (val: T) => void;
	onCommit?: (value: T) => void;
	label: string;
	error?: string | null;
	isRequired?: boolean;
	isDisabled?: boolean;
	placeholder?: string;
	autoSave?: boolean;
	uiProps?: Record<string, unknown>;
	testId?: string;
}

// We use a helper type to ensure the Registry components are compatible with WidgetProps
export type WidgetRegistry = Record<
	string,
	ComponentType<WidgetProps<FieldValue>>
>;

// 2. Map the keys to the actual Components
export const DefaultWidgets: WidgetRegistry = {
	text: TextInput as ComponentType<WidgetProps<FieldValue>>,
	number: NumberInput as ComponentType<WidgetProps<FieldValue>>,
	// email: TextInput, // You can alias multiple keys to one component
};
