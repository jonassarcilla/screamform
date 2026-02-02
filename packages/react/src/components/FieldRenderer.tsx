import { useForm } from '@/providers/FormContext';
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
	// 1. Pull submitErrors from the context
	const { getField, onChange, onCommit, submitErrors } = useForm();
	const state = getField(fieldKey);

	if (!state || !state.isVisible) return null;

	// 2. Determine the final error message
	// Priority: Submission Errors > Real-time Validation Errors
	const finalError = submitErrors?.[fieldKey] || state.error;

	// Lookup with fallback
	const Widget = (DefaultWidgets[state.widget] ||
		DefaultWidgets.text) as ComponentType<WidgetProps<FieldValue>>;

	return (
		<Widget
			fieldKey={fieldKey}
			label={state.label ?? ''}
			value={state.value as FieldValue}
			// Pass the merged error state
			error={finalError}
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
