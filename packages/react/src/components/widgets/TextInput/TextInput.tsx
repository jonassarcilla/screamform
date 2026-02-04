import { useId, useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { FieldWrapper } from '@/components/FieldWrapper';
import { cn } from '@/lib/utils';

import type { WidgetProps } from '../Registry';
import { useForm } from '@/providers/FormContext';

export function TextInput({
	fieldKey,
	value,
	label,
	onChange,
	error,
	isRequired,
	isDisabled,
	placeholder,
	autoSave = true,
	description,
	dataType,
	dataTypes,
	uiProps,
	testId,
	onCommit,
}: WidgetProps) {
	const { formVersion, getField } = useForm();
	const id = useId();
	const field = fieldKey != null ? getField(fieldKey) : undefined;

	// Local draft for uncommitted changes
	const [draft, setDraft] = useState<string>(
		value == null ? '' : String(value),
	);
	// Last value we committed; used so isDirty becomes false immediately on commit
	const [lastCommitted, setLastCommitted] = useState<string | null>(null);

	const normalizedValue = value == null ? '' : String(value);
	const prevValueRef = useRef(normalizedValue);

	// Sync draft only when value prop actually changes (e.g. after commit or reset)
	useEffect(() => {
		if (prevValueRef.current !== normalizedValue) {
			prevValueRef.current = normalizedValue;
			setDraft(normalizedValue);
			setLastCommitted(null);
		}
	}, [normalizedValue]);

	useEffect(() => {
		// When formVersion changes, the global 'Discard' was clicked.
		// We must force the local draft to match the engine's truth.
		const engineValue = String(field?.value ?? '');
		setDraft(engineValue);

		// Reset the local committed tracker so isDirty recalculates
		setLastCommitted(null);
	}, [formVersion]); // Only trigger on the version bump

	// Dirty = draft differs from authoritative value, and we didn't just commit that draft
	const isDirty =
		draft !== normalizedValue &&
		(lastCommitted === null || draft !== lastCommitted);

	const handleCommit = () => {
		onChange(draft);
		onCommit?.(draft);
		setLastCommitted(draft); // Re-render so isDirty becomes false
	};

	const handleDiscard = (): void => {
		setDraft(normalizedValue);
		setLastCommitted(null);
		// Sync engine so workingData matches committed; enables undo/redo
		onChange(normalizedValue);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVal = e.target.value;
		setDraft(newVal);

		// Only notify the engine if the value is actually different.
		// This prevents "zombie" updates during a discard/reset.
		if (newVal !== String(field?.value ?? '')) {
			onChange(newVal);
		}
	};

	return (
		<FieldWrapper
			className={cn(uiProps?.className as string | undefined)}
			label={label ?? ''}
			isRequired={isRequired}
			error={error}
			autoSave={autoSave}
			isDirty={isDirty}
			onCommit={handleCommit}
			onDiscard={handleDiscard}
			description={description}
			isDisabled={isDisabled}
			dataType={dataType}
			dataTypes={dataTypes}
		>
			<Input
				id={id}
				type="text"
				data-testid={testId}
				value={draft}
				disabled={isDisabled}
				placeholder={placeholder}
				onChange={handleChange}
				className={cn(
					'transition-colors w-full min-w-0',
					error && 'border-destructive focus-visible:ring-destructive',
				)}
			/>
		</FieldWrapper>
	);
}
