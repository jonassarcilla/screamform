import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
	uiProps,
}: WidgetProps) {
	const id = useId();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		// SOC 2 / Logic Check: If empty, send null or undefined to satisfy validation
		if (val === '') {
			onChange(undefined);
			return;
		}

		// Cast to number
		const num = Number(val);
		if (!isNaN(num)) {
			onChange(num);
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
			<Input
				id={id}
				type="number" // Triggers numeric keypad on mobile
				value={value == null ? '' : String(value)}
				disabled={isDisabled}
				placeholder={placeholder}
				onChange={handleChange}
				step={(uiProps?.step as string | number | undefined) ?? '1'}
				className={cn(
					'transition-colors',
					error && 'border-destructive focus-visible:ring-destructive',
				)}
			/>
			{error && (
				<p className="text-[0.8rem] font-medium text-destructive animate-in fade-in duration-200">
					{error}
				</p>
			)}
		</div>
	);
}
