import type {
	UISchema,
	UISchemaField,
	DataClassification,
} from '../domain/schema/types';

/**
 * Walks a schema and returns paths of fields classified as sensitive.
 * By default, returns fields with sensitivity 'pii' or 'confidential'.
 *
 * @param schema - The UISchema to analyze.
 * @param classifications - Which classifications to match (default: ['pii', 'confidential']).
 * @returns Array of field paths (e.g. ['ssn', 'address.zip']).
 */
export const getPIIFields = (
	schema: UISchema,
	classifications: DataClassification[] = ['pii', 'confidential'],
): string[] => {
	const results: string[] = [];
	walkFields(schema.fields, '', classifications, results);
	return results;
};

function walkFields(
	fields: Record<string, UISchemaField>,
	prefix: string,
	classifications: DataClassification[],
	results: string[],
): void {
	for (const [key, field] of Object.entries(fields)) {
		const path = prefix ? `${prefix}.${key}` : key;

		if (field.sensitivity && classifications.includes(field.sensitivity)) {
			results.push(path);
		}

		// Recurse into itemSchema
		if (field.itemSchema) {
			walkFields(field.itemSchema, path, classifications, results);
		}
	}
}
