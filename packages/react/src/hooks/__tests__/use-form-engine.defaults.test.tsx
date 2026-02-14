/**
 * Regression tests for default value loading.
 *
 * Guards against the bug where `dataConfig[key] ?? base.value` was incorrectly
 * implemented as `dataConfig[key] ?? ''`, which caused schema-level defaultValue
 * to be overridden by an empty string when dataConfig was provided but had no
 * entry for the field.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderForm } from '@/__test-utils__/render-form';
import {
	makeDefaultValueSchema,
	makeSchema,
	makeTextField,
} from '@/__test-utils__/schema-factories';

describe('Regression: default values load correctly', () => {
	it('shows defaultValue from schema when dataConfig is empty', async () => {
		renderForm(makeDefaultValueSchema(), { dataConfig: {} });

		await waitFor(() => {
			expect(screen.getByTestId('field-city')).toHaveValue('Calamba');
			expect(screen.getByTestId('field-country')).toHaveValue('Philippines');
		});
	});

	it('shows defaultValue when dataConfig has no entry for the field', async () => {
		renderForm(makeDefaultValueSchema(), {
			dataConfig: { nickname: 'Bestie' },
		});

		await waitFor(() => {
			// city and country not in dataConfig → fall back to defaultValue
			expect(screen.getByTestId('field-city')).toHaveValue('Calamba');
			expect(screen.getByTestId('field-country')).toHaveValue('Philippines');
			// nickname IS in dataConfig → use that
			expect(screen.getByTestId('field-nickname')).toHaveValue('Bestie');
		});
	});

	it('dataConfig values override defaultValue', async () => {
		renderForm(makeDefaultValueSchema(), {
			dataConfig: { city: 'Manila', country: 'Japan' },
		});

		await waitFor(() => {
			expect(screen.getByTestId('field-city')).toHaveValue('Manila');
			expect(screen.getByTestId('field-country')).toHaveValue('Japan');
		});
	});

	it('absent keys in dataConfig fall back to defaultValue', async () => {
		// When a key is NOT present in dataConfig at all, the engine falls
		// through to defaultValue. Note: even `{ city: undefined }` counts
		// as "present" (because `'city' in obj` is true), so it does NOT
		// trigger the defaultValue fallback — only truly absent keys do.
		renderForm(makeDefaultValueSchema(), {
			dataConfig: { nickname: 'Bestie' }, // city & country are absent
		});

		await waitFor(() => {
			expect(screen.getByTestId('field-city')).toHaveValue('Calamba');
			expect(screen.getByTestId('field-country')).toHaveValue('Philippines');
			expect(screen.getByTestId('field-nickname')).toHaveValue('Bestie');
		});
	});

	it('field without defaultValue shows empty string as fallback', async () => {
		const schema = makeSchema({
			name: makeTextField({ label: 'Name' }),
		});
		renderForm(schema, { dataConfig: {} });

		await waitFor(() => {
			expect(screen.getByTestId('field-name')).toHaveValue('');
		});
	});
});
