import { useId, useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { WidgetProps } from '../Registry';

export function NumberInput({
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
}: WidgetProps<number | undefined | null>) {
	const id = useId();

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
					type="number"
					data-testid={testId}
					value={draft}
					disabled={isDisabled}
					placeholder={placeholder}
					step={(uiProps?.step as string | number | undefined) ?? '1'}
					onChange={handleChange}
					className={cn(
						'transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
						error && 'border-destructive focus-visible:ring-destructive',
						!autoSave && isDirty && 'pr-20',
					)}
				/>

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
