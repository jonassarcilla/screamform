import { useForm } from '@/providers/FormContext';
import { DefaultWidgets, type WidgetProps } from './widgets/Registry';
import type { LogicValue } from '@screamform/core';
import type { ComponentType } from 'react';

interface FieldRendererProps {
	fieldKey: string;
}

export function FieldRenderer({ fieldKey }: FieldRendererProps) {
	// 1. Pull submitErrors and externalData from the context
	const { getField, onChange, onCommit, submitErrors, externalData } =
		useForm();
	const state = getField(fieldKey);

	if (!state || !state.isVisible) return null;

	// 2. Determine the final error message
	// Priority: Submission Errors > Real-time Validation Errors
	const finalError = submitErrors?.[fieldKey] || state.error;

	// 3. Resolve options: use externalData[optionsKey] when uiProps.optionsKey is set, else state.options
	const optionsKey = state.uiProps?.optionsKey as string | undefined;
	const rawOptions =
		optionsKey != null && externalData?.[optionsKey] != null
			? externalData[optionsKey]
			: (state.options ?? []);

	// Apply excludeOptions: remove option values from the list (compared by String(value))
	const excludeOptions = state.uiProps?.excludeOptions;
	const excludeSet =
		Array.isArray(excludeOptions) && excludeOptions.length > 0
			? new Set(excludeOptions.map((v: unknown) => String(v)))
			: null;
	const resolvedOptions =
		excludeSet != null && Array.isArray(rawOptions)
			? rawOptions.filter(
					(opt: { label: string; value: unknown }) =>
						!excludeSet!.has(String(opt.value)),
				)
			: rawOptions;

	let widgetKey = state.widget;
	if (widgetKey === 'select' && state.multiple) {
		widgetKey = 'multi-select';
	}

	// Lookup with fallback (use widgetKey so multi-select override is applied)
	const Widget = (DefaultWidgets[widgetKey] ||
		DefaultWidgets.text) as ComponentType<WidgetProps>;

	return (
		<Widget
			fieldKey={fieldKey}
			label={state.label ?? ''}
			value={state.value}
			error={finalError}
			isRequired={state.isRequired}
			isDisabled={state.isDisabled}
			isVisible={state.isVisible}
			widget={widgetKey}
			placeholder={state.placeholder}
			autoSave={state.autoSave}
			description={state.description}
			options={resolvedOptions}
			multiple={state.multiple}
			maxItems={state.maxItems}
			searchable={state.uiProps?.searchable === true}
			disabledOptions={
				Array.isArray(state.uiProps?.disabledOptions)
					? state.uiProps.disabledOptions
					: []
			}
			autoSuggestion={
				Array.isArray(state.uiProps?.autoSuggestion)
					? state.uiProps.autoSuggestion
					: undefined
			}
			dataType={state.dataType}
			dataTypes={state.dataTypes}
			testId={
				(state.uiProps?.testId as string | undefined) || `field-${fieldKey}`
			}
			onChange={(val: LogicValue) => onChange(fieldKey, val)}
			onCommit={(val: LogicValue) => onCommit(fieldKey, val)}
		/>
	);
}
