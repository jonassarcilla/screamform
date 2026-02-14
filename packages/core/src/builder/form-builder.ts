import type {
	UISchema,
	UISchemaField,
	SchemaMeta,
	LogicValue,
} from '../domain/schema/types';
import { FieldBuilder } from './field-builder';
import { SectionBuilder } from './section-builder';

/**
 * Top-level fluent builder for constructing UISchema objects.
 *
 * Usage:
 *   const schema = new FormBuilder()
 *     .addTextField('firstName').withLabel('First Name').required().done()
 *     .addSelectField('role').withLabel('Role').withOptions([...]).done()
 *     .setVersion('1.0.0')
 *     .build();
 */
export class FormBuilder {
	private readonly _fields: Map<string, UISchemaField> = new Map();
	private _meta: SchemaMeta | undefined;
	private _exclude: string[] | undefined;
	private _settings: UISchema['settings'] | undefined;

	// --- Field methods ---

	addTextField(key: string): FieldBuilder<FormBuilder> {
		return this._createFieldBuilder(key, 'text');
	}

	addNumberField(key: string): FieldBuilder<FormBuilder> {
		return this._createFieldBuilder(key, 'number');
	}

	addSelectField(key: string): FieldBuilder<FormBuilder> {
		return this._createFieldBuilder(key, 'select');
	}

	addCheckboxField(key: string): FieldBuilder<FormBuilder> {
		return this._createFieldBuilder(key, 'checkbox');
	}

	addCustomField(key: string, widget: string): FieldBuilder<FormBuilder> {
		return this._createFieldBuilder(key, widget);
	}

	/** Start building a nested section. */
	addSection(key: string): SectionBuilder<FormBuilder> {
		const sb = new SectionBuilder<FormBuilder>(key, this);
		// Override done() to register section in this FormBuilder
		const originalDone = sb.done.bind(sb);
		sb.done = (): FormBuilder => {
			const { key: sectionKey, field } = sb.build();
			this._fields.set(sectionKey, field);
			return originalDone() as unknown as FormBuilder;
		};
		return sb;
	}

	/** Add a pre-built field (from standalone factory or raw config). */
	addField(key: string, field: UISchemaField): FormBuilder {
		this._fields.set(key, field);
		return this;
	}

	/** Add multiple pre-built fields at once. */
	addFields(fields: Record<string, UISchemaField>): FormBuilder {
		for (const [key, field] of Object.entries(fields)) {
			this._fields.set(key, field);
		}
		return this;
	}

	// --- Bulk defaults ---

	/**
	 * Bulk-set defaultValue on matching fields by key.
	 * Only sets defaultValue if the field exists and the key is present in the data object.
	 */
	withDefaults(data: Record<string, LogicValue>): FormBuilder {
		for (const [key, value] of Object.entries(data)) {
			const existing = this._fields.get(key);
			if (existing) {
				existing.defaultValue = value;
			}
		}
		return this;
	}

	// --- Schema metadata ---

	setVersion(version: string): FormBuilder {
		this._meta = { ...this._meta, version };
		return this;
	}

	setMeta(meta: SchemaMeta): FormBuilder {
		this._meta = { ...this._meta, ...meta };
		return this;
	}

	// --- Schema settings ---

	exclude(...keys: string[]): FormBuilder {
		this._exclude = [...(this._exclude ?? []), ...keys];
		return this;
	}

	settings(settings: UISchema['settings']): FormBuilder {
		this._settings = { ...this._settings, ...settings };
		return this;
	}

	// --- Terminal ---

	/** Build the final UISchema object. */
	build(): UISchema {
		const fields: Record<string, UISchemaField> = {};
		for (const [key, field] of this._fields) {
			fields[key] = field;
		}

		const schema: UISchema = { fields };

		if (this._meta) {
			schema.meta = this._meta;
		}
		if (this._exclude && this._exclude.length > 0) {
			schema.exclude = this._exclude;
		}
		if (this._settings) {
			schema.settings = this._settings;
		}

		return schema;
	}

	// --- Internal ---

	private _createFieldBuilder(
		key: string,
		widget: string,
	): FieldBuilder<FormBuilder> {
		const fb = new FieldBuilder<FormBuilder>(key, widget, this);
		// Override done() to register the field in this FormBuilder
		const originalDone = fb.done.bind(fb);
		fb.done = (): FormBuilder => {
			const { key: fieldKey, field } = fb.build();
			this._fields.set(fieldKey, field);
			return originalDone() as unknown as FormBuilder;
		};
		return fb;
	}
}
