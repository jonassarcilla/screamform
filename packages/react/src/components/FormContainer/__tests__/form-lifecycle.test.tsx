/**
 * Safety-net tests for the core form lifecycle:
 *   - Renders fields from schema
 *   - Hidden fields are excluded
 *   - Required fields show validation error on submit
 *   - Successful submit calls onSave with form data
 *   - Reset restores fields to initial / last-saved values
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderForm } from '@/__test-utils__/render-form';
import {
	makeSchema,
	makeTextField,
	makeRequiredTextField,
	makeHiddenFieldSchema,
} from '@/__test-utils__/schema-factories';

describe('Form lifecycle', () => {
	it('renders all visible fields from the schema', () => {
		const schema = makeSchema({
			name: makeTextField({ label: 'Full Name' }),
			email: makeTextField({ label: 'Email Address' }),
		});
		renderForm(schema);

		expect(screen.getByText('Full Name')).toBeInTheDocument();
		expect(screen.getByText('Email Address')).toBeInTheDocument();
	});

	it('does not render a hidden field', async () => {
		// The schema has a "hidden" field with a HIDE rule that triggers
		// when "visible" field is empty (which it is, by default).
		renderForm(makeHiddenFieldSchema());

		// Visible field should render
		expect(screen.getByText('Visible Field')).toBeInTheDocument();

		// Hidden field should NOT render
		expect(screen.queryByText('Hidden Field')).not.toBeInTheDocument();
	});

	it('shows validation errors on submit when required fields are empty', async () => {
		const onSave = vi.fn();
		const schema = makeSchema({
			title: makeRequiredTextField('Title', 'Title is required'),
			body: makeTextField({ label: 'Body' }),
		});
		const { user } = renderForm(schema, {
			dataConfig: { title: '', body: '' },
			onSave,
		});

		// Click Save without filling the required field
		const saveButton = screen.getByRole('button', { name: /save changes/i });
		await user.click(saveButton);

		// onSave should NOT have been called (validation fails)
		expect(onSave).not.toHaveBeenCalled();

		// The submit error for the required field should appear
		await waitFor(() => {
			expect(screen.getByText('Title is required')).toBeInTheDocument();
		});
	});

	it('calls onSave with form data on successful submit', async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const schema = makeSchema({
			title: makeRequiredTextField('Title', 'Title is required'),
		});
		const { user } = renderForm(schema, {
			dataConfig: { title: '' },
			onSave,
		});

		// Fill the required field
		const titleInput = screen.getByTestId('field-title');
		await user.type(titleInput, 'My Report');

		// Click Save
		const saveButton = screen.getByRole('button', { name: /save changes/i });
		await user.click(saveButton);

		await waitFor(() => {
			expect(onSave).toHaveBeenCalledTimes(1);
		});

		// The first argument is the submitted data
		const savedData = onSave.mock.calls[0][0] as Record<string, unknown>;
		expect(savedData.title).toBe('My Report');
	});

	it('reset restores fields to last-saved state', async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const schema = makeSchema({
			title: makeTextField({ label: 'Title' }),
		});
		const { user } = renderForm(schema, {
			dataConfig: { title: 'Original' },
			onSave,
		});

		const titleInput = screen.getByTestId('field-title');
		expect(titleInput).toHaveValue('Original');

		// Save the initial state (triggers a save so reset has a baseline)
		// First modify so hasFormChanges = true
		await user.clear(titleInput);
		await user.type(titleInput, 'Modified');
		expect(titleInput).toHaveValue('Modified');

		// Save
		const saveButton = screen.getByRole('button', { name: /save changes/i });
		await user.click(saveButton);
		await waitFor(() => {
			expect(onSave).toHaveBeenCalledTimes(1);
		});

		// Now modify again
		await user.clear(titleInput);
		await user.type(titleInput, 'Another Change');
		expect(titleInput).toHaveValue('Another Change');

		// Reset — window.confirm is stubbed to return true
		vi.spyOn(window, 'confirm').mockReturnValue(true);
		const resetButton = screen.getByRole('button', { name: /reset/i });
		await user.click(resetButton);

		// The field should revert to the last-saved value
		await waitFor(() => {
			expect(titleInput).toHaveValue('Modified');
		});

		vi.restoreAllMocks();
	});
});
