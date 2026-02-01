// packages/react/src/components/FieldRenderer.tsx
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
	const { getField, onChange } = useForm();
	const state = getField(fieldKey);

	if (!state || !state.isVisible) return null;

	// Lookup with fallback
	const Widget = (DefaultWidgets[state.widget] ||
		DefaultWidgets.text) as ComponentType<WidgetProps<FieldValue>>;

	return (
		<Widget
			label={state.label}
			value={state.value as FieldValue}
			error={state.error}
			isRequired={state.isRequired}
			isDisabled={state.isDisabled}
			placeholder={state.placeholder}
			testId={
				(state.uiProps?.testId as string | undefined) || `field-${fieldKey}`
			}
			uiProps={state.uiProps as Record<string, unknown>}
			onChange={(val: FieldValue) => onChange(fieldKey, val)}
		/>
	);
}
