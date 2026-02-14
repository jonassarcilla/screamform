/**
 * Regression tests for onChange / validation error clearing.
 *
 * These tests guard against the bugs fixed in the form engine:
 *   1. `batch()` fix — without batching, committedData.set() triggered a
 *      formState$ recomputation where workingData still held the stale value,
 *      producing a transient "required" error that was pushed to the UI.
 *   2. `useMemo` dependency stability — `options` (an object) was used in the
 *      dependency array instead of `isDebug` (a boolean). Since `{ isDebug }`
 *      creates a new object on every render, formState$ and formFieldStates$
 *      were recreated on every render, destroying per-field subscriptions.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderForm } from '@/__test-utils__/render-form';
import { makeTwoRequiredFieldsSchema } from '@/__test-utils__/schema-factories';

describe('Regression: onChange clears validation errors', () => {
	it('clears the error on the first required field after typing', async () => {
		const { user } = renderForm(makeTwoRequiredFieldsSchema(), {
			dataConfig: { fullName: '', email: '' },
		});

		// Initially, both required fields show errors
		expect(screen.getByText('Full Name is required')).toBeInTheDocument();
		expect(screen.getByText('Email is required')).toBeInTheDocument();

		// Type in the first field
		const fullNameInput = screen.getByTestId('field-fullName');
		await user.type(fullNameInput, 'Alice');

		// The fullName error should clear
		await waitFor(() => {
			expect(
				screen.queryByText('Full Name is required'),
			).not.toBeInTheDocument();
		});
	});

	it('clears the error on the SECOND required field after typing', async () => {
		const { user } = renderForm(makeTwoRequiredFieldsSchema(), {
			dataConfig: { fullName: '', email: '' },
		});

		// Initially, both errors are visible
		expect(screen.getByText('Full Name is required')).toBeInTheDocument();
		expect(screen.getByText('Email is required')).toBeInTheDocument();

		// Type in the SECOND field (the exact bug scenario)
		const emailInput = screen.getByTestId('field-email');
		await user.type(emailInput, 'test@example.com');

		// The email error MUST clear — this was the bug
		await waitFor(() => {
			expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
		});
	});

	it('clears errors on both fields when both are filled sequentially', async () => {
		const { user } = renderForm(makeTwoRequiredFieldsSchema(), {
			dataConfig: { fullName: '', email: '' },
		});

		const fullNameInput = screen.getByTestId('field-fullName');
		const emailInput = screen.getByTestId('field-email');

		// Fill first field
		await user.type(fullNameInput, 'Alice');
		await waitFor(() => {
			expect(
				screen.queryByText('Full Name is required'),
			).not.toBeInTheDocument();
		});

		// Fill second field
		await user.type(emailInput, 'alice@example.com');
		await waitFor(() => {
			expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
		});

		// No errors should remain
		expect(screen.queryByText('Full Name is required')).not.toBeInTheDocument();
		expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
	});

	it('shows the error again if the field is cleared', async () => {
		const { user } = renderForm(makeTwoRequiredFieldsSchema(), {
			dataConfig: { fullName: '', email: '' },
		});

		const emailInput = screen.getByTestId('field-email');

		// Type then clear
		await user.type(emailInput, 'hello');
		await waitFor(() => {
			expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
		});

		await user.clear(emailInput);
		await waitFor(() => {
			expect(screen.getByText('Email is required')).toBeInTheDocument();
		});
	});
});
