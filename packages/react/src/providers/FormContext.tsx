import { createContext, useContext, type ReactNode } from 'react';

// We extract only what the components need to know
interface FormContextType {
	onChange: (key: string, value: any) => void;
	getField: (key: string) => any;
}

const FormContext = createContext<FormContextType | null>(null);

export function FormProvider({
	children,
	value,
}: {
	children: ReactNode;
	value: FormContextType;
}) {
	return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export const useForm = () => {
	const context = useContext(FormContext);
	if (!context) throw new Error('useForm must be used within a FormProvider');
	return context;
};
