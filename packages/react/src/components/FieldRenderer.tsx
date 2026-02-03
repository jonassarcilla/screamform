import { useForm } from '@/providers/FormContext';
import { DefaultWidgets, type WidgetProps } from './widgets/Registry';
import type { LogicValue } from '@screamform/core';
import type { ComponentType } from 'react';

interface FieldRendererProps {
	fieldKey: string;
}

export function FieldRenderer({ fieldKey }: FieldRendererProps) {
	// 1. Pull submitErrors from the context
	const { getField, onChange, onCommit, submitErrors } = useForm();
	const state = getField(fieldKey);

	if (!state || !state.isVisible) return null;

	// 2. Determine the final error message
	// Priority: Submission Errors > Real-time Validation Errors
	const finalError = submitErrors?.[fieldKey] || state.error;

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
			options={state.options}
			multiple={state.multiple}
			maxItems={state.maxItems}
			dataType={state.dataType}
			testId={
				(state.uiProps?.testId as string | undefined) || `field-${fieldKey}`
			}
			onChange={(val: LogicValue) => onChange(fieldKey, val)}
			onCommit={(val: LogicValue) => onCommit(fieldKey, val)}
		/>
	);
}
