import { render, type RenderResult } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { UISchema } from '@screamform/core';
import { FormContainer } from '@/components/FormContainer/FormContainer';

interface RenderFormOptions {
	dataConfig?: Record<string, unknown>;
	isDebug?: boolean;
	onSave?: (data: Record<string, unknown>) => Promise<void>;
}

interface RenderFormResult extends RenderResult {
	user: UserEvent;
}

/**
 * Render a `<FormContainer>` with sensible defaults.
 * Returns the standard Testing Library queries plus a pre-configured `user` from userEvent.
 */
export function renderForm(
	schema: UISchema,
	opts: RenderFormOptions = {},
): RenderFormResult {
	const user = userEvent.setup();
	const result = render(
		<FormContainer
			schema={schema}
			dataConfig={opts.dataConfig}
			isDebug={opts.isDebug}
			onSave={opts.onSave}
		/>,
	);
	return { ...result, user };
}
