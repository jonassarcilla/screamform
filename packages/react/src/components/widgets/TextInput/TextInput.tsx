import { useId, useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react'; // Using Lucide for the icons
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
		<div
			className={cn(
				'grid w-full items-center gap-1.5',
				uiProps?.className as string | undefined,
			)}
		>
			<Label htmlFor={id} className={cn(error && 'text-destructive')}>
				{label}{' '}
				{isRequired && <span className="text-destructive font-bold">*</span>}
			</Label>

			<div className="relative flex items-center gap-2">
				<Input
					id={id}
					type="text"
					data-testid={testId}
					value={draft}
					disabled={isDisabled}
					placeholder={placeholder}
					onChange={handleChange}
					className={cn(
						'transition-colors',
						error && 'border-destructive focus-visible:ring-destructive',
						!autoSave && isDirty && 'pr-20', // Extra padding when buttons are visible
					)}
				/>

				{/* 4. Action Icons: Only visible when autoSave is off and value is modified */}
				{!autoSave && isDirty && !isDisabled && (
					<div className="absolute right-1 flex items-center gap-0.5 animate-in fade-in slide-in-from-right-1 duration-200">
						<Button
							type="button"
							size="icon"
							variant="ghost"
							onClick={handleCommit}
							className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
							title="Commit change"
						>
							<Check className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							size="icon"
							variant="ghost"
							onClick={handleDiscard}
							className="h-8 w-8 text-destructive hover:bg-destructive/10"
							title="Discard change"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				)}
			</div>

			{error && (
				<p className="text-[0.8rem] font-medium text-destructive animate-in fade-in duration-200">
					{error}
				</p>
			)}
		</div>
	);
}
