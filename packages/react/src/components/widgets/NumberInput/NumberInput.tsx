import { useId, useState, useEffect, useRef, useMemo } from 'react';
import { inputBaseClassName } from '@/components/ui/input';
import { FieldWrapper } from '@/components/FieldWrapper';
import { cn } from '@/lib/utils';

import type { WidgetProps } from '../Registry';

export function NumberInput({
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
	const id = useId();
	// Renders native <input> so React Scan shows "NumberInput.fieldKey" (this component must be direct parent of <input>)
	const FieldInput = useMemo(() => {
		const C = ({ className, ...props }: React.ComponentProps<'input'>) => (
			<input
				data-slot="input"
				className={cn(inputBaseClassName, className)}
				{...props}
			/>
		);
		C.displayName = fieldKey ? `NumberInput.${fieldKey}` : 'NumberInput';
		return C;
	}, [fieldKey]);

	// 1. Local draft as string to handle typing and empty states safely
	const [draft, setDraft] = useState<string>(
		value == null ? '' : String(value),
	);

	// 2. Local commit tracker to hide UI icons instantly
	const [lastCommitted, setLastCommitted] = useState<string | null>(null);

	const normalizedValue = value == null ? '' : String(value);
	const prevValueRef = useRef(normalizedValue);

	useEffect(() => {
		if (prevValueRef.current !== normalizedValue) {
			prevValueRef.current = normalizedValue;
			setDraft(normalizedValue);
			setLastCommitted(null);
		}
	}, [normalizedValue]);

	// 3. Logic to determine if UI should show Check/X
	const isDirty =
		draft !== normalizedValue &&
		(lastCommitted === null || draft !== lastCommitted);

	// 4. Safe parsing for Number type
	const parseValue = (val: string): number | undefined => {
		if (val === '') return undefined;
		const num = Number(val);
		return isNaN(num) ? undefined : num;
	};

	const handleCommit = () => {
		const parsed = parseValue(draft);
		onChange(parsed);
		onCommit?.(parsed);
		setLastCommitted(draft);
	};

	const handleDiscard = (): void => {
		setDraft(normalizedValue);
		setLastCommitted(null);
		// Sync engine so workingData matches committed; enables undo/redo
		onChange(parseValue(normalizedValue));
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value;

		// 1. Update local draft (keep as string to allow typing decimals/negatives)
		setDraft(rawValue);

		// 2. Convert to number for the engine
		const numericValue = rawValue === '' ? 0 : Number(rawValue);

		// 3. Report to engine immediately to trigger isFormDirty
		onChange(numericValue);
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
			<FieldInput
				id={id}
				type="number"
				data-testid={testId}
				value={draft}
				disabled={isDisabled}
				placeholder={placeholder}
				step={(uiProps?.step as string | number | undefined) ?? '1'}
				onChange={handleChange}
				className={cn(
					'transition-colors w-full min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
					error && 'border-destructive focus-visible:ring-destructive',
				)}
			/>
		</FieldWrapper>
	);
}
NumberInput.displayName = 'NumberInput';
