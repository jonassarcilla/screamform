import { useWidgetRegistry } from '@/providers/FormContext';
import type { FieldState, LogicValue } from '@screamform/core';
import type { ComponentType } from 'react';
import type { WidgetProps } from '../Registry';

/**
 * SectionWidget renders a labelled group of nested child fields.
 *
 * The form engine already computes `children: Record<string, FieldState>`
 * for any field with `itemSchema`. This widget simply iterates over
 * those children and delegates rendering to the appropriate widget from
 * the registry, wiring `onChange` to update the section's value object.
 */
export function SectionWidget({
	fieldKey,
	label,
	value,
	error,
	isDisabled,
	isVisible,
	children: childStates,
	onChange,
}: WidgetProps) {
	const registry = useWidgetRegistry();

	if (!isVisible) return null;

	// children can be Record<string, FieldState> (section) or an array (array widget)
	// SectionWidget only handles the record case
	const childMap =
		childStates != null && !Array.isArray(childStates)
			? (childStates as Record<string, FieldState>)
			: null;

	if (!childMap || Object.keys(childMap).length === 0) {
		return (
			<fieldset className="space-y-4 rounded-lg border p-4">
				<legend className="px-1 font-semibold text-sm">{label}</legend>
				<p className="text-muted-foreground text-sm">
					No fields in this section.
				</p>
			</fieldset>
		);
	}

	// The section's value is an object — update the relevant key on child change
	const sectionValue =
		value != null && typeof value === 'object' && !Array.isArray(value)
			? (value as Record<string, unknown>)
			: {};

	const handleChildChange = (childKey: string, childValue: LogicValue) => {
		const next = { ...sectionValue, [childKey]: childValue };
		onChange(next as unknown as LogicValue);
	};

	return (
		<fieldset className="space-y-4 rounded-lg border p-4">
			<legend className="px-1 font-semibold text-sm">{label}</legend>
			{error && (
				<p className="font-medium text-[0.8rem] text-destructive">{error}</p>
			)}
			{Object.entries(childMap).map(([childKey, childState]) => {
				if (!childState.isVisible) return null;

				let widgetKey = childState.widget;
				if (widgetKey === 'select' && childState.multiple) {
					widgetKey = 'multi-select';
				}
				const Widget = (registry[widgetKey] ||
					registry.text) as ComponentType<WidgetProps>;

				return (
					<Widget
						key={childKey}
						fieldKey={fieldKey ? `${fieldKey}.${childKey}` : childKey}
						label={childState.label ?? ''}
						value={childState.value}
						error={childState.error}
						isRequired={childState.isRequired}
						isDisabled={isDisabled || childState.isDisabled}
						isVisible={childState.isVisible}
						widget={widgetKey}
						placeholder={childState.placeholder}
						description={childState.description}
						options={childState.options ?? []}
						multiple={childState.multiple}
						maxItems={childState.maxItems}
						dataType={childState.dataType}
						uiProps={childState.uiProps}
						testId={`field-${fieldKey}.${childKey}`}
						onChange={(val: LogicValue) => handleChildChange(childKey, val)}
					/>
				);
			})}
		</fieldset>
	);
}
SectionWidget.displayName = 'SectionWidget';
