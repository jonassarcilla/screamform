import { memo } from 'react';
import {
	useFormField,
	useFormActions,
	useFormMetaForField,
	useFormIsDebug,
	useWidgetRegistry,
} from '@/providers/FormContext';
import { useRenderCount } from '@/hooks/use-render-count';
import type { WidgetProps } from './widgets/Registry';
import type { FieldState, LogicValue } from '@screamform/core';
import type { ComponentType } from 'react';

function shallowEqualFieldState(a: FieldState, b: FieldState): boolean {
	if (!a || !b) return a === b;
	return (
		a.value === b.value &&
		a.isVisible === b.isVisible &&
		a.isDisabled === b.isDisabled &&
		a.error === b.error &&
		a.isRequired === b.isRequired &&
		a.label === b.label &&
		a.widget === b.widget &&
		a.placeholder === b.placeholder &&
		a.autoSave === b.autoSave &&
		a.multiple === b.multiple
	);
}

interface FieldRendererProps {
	fieldKey: string;
}

interface FieldRendererContentProps extends FieldRendererProps {
	state: FieldState;
	submitError: string | undefined;
	formVersion: number;
	externalData?: Record<string, Array<{ label: string; value: unknown }>>;
	isDebug: boolean;
	renderCount: number;
}

const FieldRendererContent = memo(
	function FieldRendererContent({
		fieldKey,
		state,
		submitError,
		formVersion,
		externalData,
		isDebug,
		renderCount,
	}: FieldRendererContentProps) {
		const { onChange, commit } = useFormActions();
		const registry = useWidgetRegistry();

		const finalError = submitError || state.error;

		const optionsKey = state.uiProps?.optionsKey as string | undefined;
		const rawOptions =
			optionsKey != null && externalData?.[optionsKey] != null
				? externalData[optionsKey]
				: (state.options ?? []);

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

		const Widget = (registry[widgetKey] ||
			registry.text) as ComponentType<WidgetProps>;

		const widgetElement = (
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
				formVersion={formVersion}
				onChange={(val: LogicValue) => onChange(fieldKey, val)}
				onCommit={(val: LogicValue) => commit(fieldKey, val)}
			/>
		);

		if (isDebug) {
			return (
				<div className="relative">
					<span
						className="absolute -top-1 -right-1 z-10 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-mono text-white"
						title={`${fieldKey}: ${renderCount} renders`}
					>
						R:{renderCount}
					</span>
					{widgetElement}
				</div>
			);
		}

		return widgetElement;
	},
	(prev, next) =>
		prev.fieldKey === next.fieldKey &&
		shallowEqualFieldState(prev.state, next.state) &&
		prev.submitError === next.submitError &&
		prev.formVersion === next.formVersion &&
		prev.isDebug === next.isDebug,
);
FieldRendererContent.displayName = 'FieldRendererContent';

export function FieldRenderer({ fieldKey }: FieldRendererProps) {
	const state = useFormField(fieldKey);
	const { submitError, externalData, formVersion } =
		useFormMetaForField(fieldKey);
	const isDebug = useFormIsDebug();
	const renderCount = useRenderCount();

	if (!state || !state.isVisible) return null;

	return (
		<FieldRendererContent
			fieldKey={fieldKey}
			state={state}
			submitError={submitError}
			formVersion={formVersion}
			externalData={externalData}
			isDebug={isDebug}
			renderCount={renderCount}
		/>
	);
}
FieldRenderer.displayName = 'FieldRenderer';
