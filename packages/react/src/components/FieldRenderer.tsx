import { useForm } from '../providers/FormContext';
import {
	DefaultWidgets,
	type WidgetProps,
	type FieldValue,
} from './widgets/Registry';
import type { ComponentType } from 'react';

interface FieldRendererProps {
	fieldKey: string;
}

export function FieldRenderer({ fieldKey }: FieldRendererProps) {
	// 1. Extract onCommit from the updated FormContext
	const { getField, onChange, onCommit } = useForm();
	const state = getField(fieldKey);

	if (!state || !state.isVisible) return null;

	// Lookup with fallback
	const Widget = (DefaultWidgets[state.widget] ||
		DefaultWidgets.text) as ComponentType<WidgetProps<FieldValue>>;

	return (
		<Widget
			// Pass the fieldKey so the widget knows its own identity
			fieldKey={fieldKey}
			label={state.label ?? ''}
			value={state.value as FieldValue}
			error={state.error}
			isRequired={state.isRequired}
			isDisabled={state.isDisabled}
			placeholder={state.placeholder}
			autoSave={state.autoSave}
			testId={
				(state.uiProps?.testId as string | undefined) || `field-${fieldKey}`
			}
			onChange={(val) => onChange(fieldKey, val)}
			onCommit={(val) => onCommit(fieldKey, val)}
		/>
	);
}
