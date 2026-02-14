/**
 * Regression tests for SectionWidget rendering.
 *
 * Guards against the bug where the section rendered `[object Object]`
 * because:
 *   1. There was no `section` widget in the registry.
 *   2. The FieldRenderer did not pass `state.children` to the widget.
 *   3. The TextInput fallback tried to String() the section's value object.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderForm } from '@/__test-utils__/render-form';
import { makeSectionSchema } from '@/__test-utils__/schema-factories';

describe('Regression: SectionWidget renders children', () => {
	it('renders a fieldset with the section label as legend', async () => {
		renderForm(makeSectionSchema());

		await waitFor(() => {
			// The section renders as a <fieldset> with a <legend>
			const legend = screen.getByText('Contact Info');
			expect(legend).toBeInTheDocument();
			expect(legend.tagName).toBe('LEGEND');
		});
	});

	it('renders child text inputs inside the section', async () => {
		renderForm(makeSectionSchema());

		await waitFor(() => {
			// Child fields should be rendered as actual inputs, not [object Object]
			expect(screen.getByText('Phone')).toBeInTheDocument();
			expect(screen.getByText('Website')).toBeInTheDocument();
		});

		// The text "[object Object]" should NEVER appear
		expect(screen.queryByText('[object Object]')).not.toBeInTheDocument();
	});

	it('typing in a section child updates the child input', async () => {
		const { user } = renderForm(makeSectionSchema());

		await waitFor(() => {
			expect(screen.getByTestId('field-contactInfo.phone')).toBeInTheDocument();
		});

		const phoneInput = screen.getByTestId('field-contactInfo.phone');
		await user.type(phoneInput, '09171234567');

		expect(phoneInput).toHaveValue('09171234567');
	});

	it('non-section fields render alongside the section', async () => {
		renderForm(makeSectionSchema());

		await waitFor(() => {
			// Top-level text field should also render
			expect(screen.getByText('Username')).toBeInTheDocument();
			// Section should render
			expect(screen.getByText('Contact Info')).toBeInTheDocument();
		});
	});
});
