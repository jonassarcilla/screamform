import type { UISchema } from '@screamform/core';
import { useFormEngine } from '../../hooks/use-form-engine';
import { FormProvider } from '../../providers/FormContext';
import { FieldRenderer } from '../FieldRenderer';

interface FormContainerProps {
	schema: UISchema;
	dataConfig?: Record<string, any>;
}

export function FormContainer({ schema, dataConfig }: FormContainerProps) {
	const engine = useFormEngine(schema, dataConfig);

	// We provide a stable API to the context
	const contextValue = {
		onChange: engine.onChange,
		getField: (key: string) => engine.fields[key],
	};

	return (
		<FormProvider value={contextValue}>
			<div className="space-y-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
				{Object.keys(schema.fields).map((key) => (
					<FieldRenderer key={key} fieldKey={key} />
				))}
			</div>
		</FormProvider>
	);
}
