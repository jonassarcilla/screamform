import type { ComponentType } from 'react';
import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';
import { SelectInput } from './SelectInput';
import { SectionWidget } from './SectionWidget';
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
	/** Bumped on reset; widgets sync draft when it changes */
	formVersion?: number;
	/** When true, single/multi-select shows search/filter UI and filters options by query. */
	searchable?: boolean;
	/** Option values to show but make non-selectable (disabled). Compared by String(value). */
	disabledOptions?: unknown[];
	/** For text: suggestion strings for datalist/autocomplete. */
	autoSuggestion?: string[];
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
	section: SectionWidget as ComponentType<WidgetProps>,
	// switch: BooleanInput as ComponentType<WidgetProps>,
};
