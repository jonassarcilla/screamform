import type { Meta, StoryObj } from '@storybook/react';
import type { UISchemaField } from '@screamform/core';
import { FormContainer } from './FormContainer';
import { useForm } from '../../providers/FormContext';
import { DefaultWidgets, type WidgetProps } from '../widgets/Registry';
import { FieldWrapper } from '../FieldWrapper';

const SHARED_SELECT_OPTIONS = [
	{ label: 'Option A', value: 'a' },
	{ label: 'Option B', value: 'b' },
	{ label: 'Option C', value: 'c' },
	{ label: 'Option D', value: 'd' },
];

function createManyFieldsSchema(count: number) {
	const widgets: Array<'text' | 'number' | 'select' | 'multi-select'> = [
		'text',
		'number',
		'select',
		'multi-select',
	];
	const fields: Record<string, UISchemaField> = {};
	const dataConfig: Record<string, unknown> = {};
	for (let i = 0; i < count; i++) {
		const key = `field_${i}`;
		const widget = widgets[i % widgets.length];
		// Deterministic "random" autoSave: false for ~30% of fields (same result every load)
		const autoSaveFalse = (i * 7 + 11) % 10 < 3;
		const base: Pick<UISchemaField, 'label' | 'autoSave'> = {
			label: `Field ${i + 1} (${widget}${autoSaveFalse ? ', no autoSave' : ''})`,
			...(autoSaveFalse && { autoSave: false }),
		};
		if (widget === 'text') {
			fields[key] = { widget: 'text', ...base };
			dataConfig[key] = '';
		} else if (widget === 'number') {
			fields[key] = { widget: 'number', ...base };
			dataConfig[key] = 0;
		} else if (widget === 'select') {
			fields[key] = {
				widget: 'select',
				...base,
				placeholder: 'Choose...',
				options: SHARED_SELECT_OPTIONS,
			};
			dataConfig[key] = undefined;
		} else {
			fields[key] = {
				widget: 'select',
				multiple: true,
				...base,
				placeholder: 'Pick...',
				options: SHARED_SELECT_OPTIONS,
				uiProps: { maxItems: 4 },
			};
			dataConfig[key] = [];
		}
	}
	return { schema: { fields }, dataConfig };
}

const meta: Meta<typeof FormContainer> = {
	title: 'Components/FormContainer',
	component: FormContainer,
	parameters: {
		docs: {
			description: {
				component:
					'**React Scan (Storybook):** (1) Start Storybook (`pnpm storybook`). (2) Open a story in the canvas (e.g. Default). (3) Run `npx react-scan@latest "http://localhost:6006/iframe.html?id=components-formcontainer--default"` in another terminal. React Scan opens a browser window and highlights re-renders.',
			},
		},
	},
	argTypes: {
		schema: {
			control: 'object',
			description: 'The UI schema defining form fields',
		},
		dataConfig: {
			control: 'object',
			description: 'Initial data configuration for the form',
		},
		isDebug: {
			control: 'boolean',
			description: 'Enable debug logging in the console',
		},
	},
};

export default meta;
type Story = StoryObj<typeof FormContainer>;

export const Default: Story = {
	args: {
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				budget: { widget: 'number', label: 'Budget Limit' },
			},
		},
		dataConfig: {
			title: 'Initial Project Title',
			budget: 100000,
		},
	},
};

export const WithDebug: Story = {
	args: {
		isDebug: true,
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				budget: { widget: 'number', label: 'Budget Limit' },
			},
		},
	},
};

export const WithProfiler: Story = {
	name: 'With Profiler (isDebug + onProfile)',
	args: {
		isDebug: true,
		onProfile: (
			_id: string,
			_phase: string,
			_actualDuration: number,
			_baseDuration: number,
		) => {},
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				budget: { widget: 'number', label: 'Budget Limit' },
			},
		},
		dataConfig: { title: '', budget: 0 },
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
};

export const WithAutoSaveDisabled: Story = {
	args: {
		isDebug: true,
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					autoSave: false,
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				budget: {
					widget: 'number',
					label: 'Budget Limit',
				},
			},
		},
		dataConfig: {
			title: 'Initial Project Title',
			budget: 100000,
		},
	},
};

export const WithSelectInput: Story = {
	args: {
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				status: {
					widget: 'select',
					label: 'Status',
					placeholder: 'Choose status...',
					options: [
						{ label: 'Draft', value: 'draft' },
						{ label: 'In Review', value: 'in_review' },
						{ label: 'Published', value: 'published' },
					],
				},
			},
		},
		dataConfig: {
			title: 'My Project',
			status: 'draft',
		},
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
};

export const TextInputWithAutoSuggestion: Story = {
	name: 'Text Input with autoSuggestion',
	args: {
		schema: {
			fields: {
				fruit: {
					widget: 'text',
					label: 'Fruit',
					placeholder: 'Type or pick a fruit...',
					uiProps: {
						autoSuggestion: ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'],
					},
				},
			},
		},
		dataConfig: { fruit: '' },
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
};

export const WithMultiSelect: Story = {
	args: {
		schema: {
			fields: {
				name: {
					widget: 'text',
					label: 'Name',
				},
				tags: {
					widget: 'select',
					label: 'Tags',
					multiple: true,
					placeholder: 'Pick tags...',
					options: [
						{ label: 'React', value: 'react' },
						{ label: 'TypeScript', value: 'typescript' },
						{ label: 'Form', value: 'form' },
						{ label: 'UI', value: 'ui' },
					],
					uiProps: { maxItems: 5 },
				},
			},
		},
		dataConfig: {
			name: '',
			tags: ['react', 'typescript'],
		},
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
};

export const WithDescriptions: Story = {
	name: 'With Descriptions',
	args: {
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					description:
						'A short, memorable name for the project. Used in the header and breadcrumbs.',
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				budget: {
					widget: 'number',
					label: 'Budget Limit',
					description:
						'<p>Maximum spend for this project in <strong>USD</strong>. Use <code>0</code> for no limit.</p>',
				},
				status: {
					widget: 'select',
					label: 'Status',
					placeholder: 'Choose status...',
					description:
						'<p>Workflow state:</p><ul><li><strong>Draft</strong> — not yet submitted</li><li><strong>In Review</strong> — under review</li><li><strong>Published</strong> — live</li></ul>',
					options: [
						{ label: 'Draft', value: 'draft' },
						{ label: 'In Review', value: 'in_review' },
						{ label: 'Published', value: 'published' },
					],
				},
			},
		},
		dataConfig: {
			title: 'Q1 Campaign',
			budget: 50000,
			status: 'draft',
		},
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
};

/** Single-select, required, empty options: shows "None" option and defaults value to "none". */
export const RequiredSelectEmptyOptions: Story = {
	name: 'Required Select (Empty Options)',
	args: {
		schema: {
			fields: {
				name: {
					widget: 'text',
					label: 'Name',
					validation: { type: 'required', errorMessage: 'Name is required' },
				},
				category: {
					widget: 'select',
					label: 'Category',
					placeholder: 'Select...',
					options: [],
					validation: {
						type: 'required',
						errorMessage: 'Category is required',
					},
				},
			},
		},
		dataConfig: {
			name: '',
			category: undefined,
		},
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
};

/** Single-select with uiProps.searchable: true — search/filter options by typing. */
export const SearchableSingleSelect: Story = {
	name: 'Searchable Single Select',
	args: {
		schema: {
			fields: {
				country: {
					widget: 'select',
					label: 'Country',
					placeholder: 'Search or choose...',
					uiProps: { searchable: true },
					options: [
						{ label: 'United States', value: 'us' },
						{ label: 'United Kingdom', value: 'uk' },
						{ label: 'Canada', value: 'ca' },
						{ label: 'Australia', value: 'au' },
						{ label: 'Germany', value: 'de' },
						{ label: 'France', value: 'fr' },
						{ label: 'Japan', value: 'jp' },
						{ label: 'Brazil', value: 'br' },
						{ label: 'India', value: 'in' },
						{ label: 'Spain', value: 'es' },
					],
				},
			},
		},
		dataConfig: { country: undefined },
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
};

/** Multi-select with uiProps.searchable: true — filter options by typing in dropdown. */
export const SearchableMultiSelect: Story = {
	name: 'Searchable Multi Select',
	args: {
		schema: {
			fields: {
				skills: {
					widget: 'select',
					label: 'Skills',
					multiple: true,
					placeholder: 'Search and pick skills...',
					uiProps: { searchable: true, maxItems: 5 },
					options: [
						{ label: 'JavaScript', value: 'js' },
						{ label: 'TypeScript', value: 'ts' },
						{ label: 'React', value: 'react' },
						{ label: 'Vue', value: 'vue' },
						{ label: 'Node.js', value: 'node' },
						{ label: 'Python', value: 'python' },
						{ label: 'Rust', value: 'rust' },
						{ label: 'Go', value: 'go' },
						{ label: 'SQL', value: 'sql' },
						{ label: 'GraphQL', value: 'graphql' },
					],
				},
			},
		},
		dataConfig: { skills: [] },
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
};

/** Single- and multi-select with uiProps.excludeOptions and uiProps.disabledOptions. */
export const ExcludeAndDisabledOptions: Story = {
	name: 'Exclude and Disabled Options',
	args: {
		schema: {
			fields: {
				status: {
					widget: 'select',
					label: 'Status',
					placeholder: 'Choose status...',
					uiProps: {
						excludeOptions: ['archived'],
						disabledOptions: ['legacy'],
					},
					options: [
						{ label: 'Draft', value: 'draft' },
						{ label: 'In Review', value: 'in_review' },
						{ label: 'Published', value: 'published' },
						{ label: 'Archived', value: 'archived' },
						{ label: 'Legacy', value: 'legacy' },
					],
				},
				tags: {
					widget: 'select',
					label: 'Tags',
					multiple: true,
					placeholder: 'Pick tags...',
					uiProps: {
						maxItems: 5,
						excludeOptions: ['deprecated'],
						disabledOptions: ['readonly'],
					},
					options: [
						{ label: 'React', value: 'react' },
						{ label: 'TypeScript', value: 'typescript' },
						{ label: 'Form', value: 'form' },
						{ label: 'Deprecated', value: 'deprecated' },
						{ label: 'Read-only', value: 'readonly' },
					],
				},
			},
		},
		dataConfig: { status: undefined, tags: [] },
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
};

/** Demonstrates updateFieldSchema: buttons dynamically set excludeOptions on the Status field. */
function UpdateSchemaDemo() {
	const { updateFieldSchema } = useForm();
	return (
		<div className="flex flex-wrap items-center gap-2 rounded-md border border-muted-foreground/30 border-dashed bg-muted/30 px-3 py-2 text-sm">
			<span className="font-medium text-muted-foreground">
				updateFieldSchema:
			</span>
			<button
				type="button"
				onClick={() =>
					updateFieldSchema?.('status', {
						uiProps: { excludeOptions: ['archived'] },
					})
				}
				className="rounded bg-primary px-2 py-1 text-primary-foreground hover:opacity-90"
			>
				Exclude &quot;Archived&quot;
			</button>
			<button
				type="button"
				onClick={() =>
					updateFieldSchema?.('status', {
						uiProps: { excludeOptions: ['archived', 'legacy'] },
					})
				}
				className="rounded bg-primary px-2 py-1 text-primary-foreground hover:opacity-90"
			>
				Exclude &quot;Archived&quot; + &quot;Legacy&quot;
			</button>
			<button
				type="button"
				onClick={() =>
					updateFieldSchema?.('status', {
						uiProps: { excludeOptions: [] },
					})
				}
				className="rounded border border-input bg-background px-2 py-1 hover:bg-accent"
			>
				Reset exclusions
			</button>
		</div>
	);
}

export const UpdateFieldSchema: Story = {
	name: 'Update Field Schema (excludeOptions)',
	args: {
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				status: {
					widget: 'select',
					label: 'Status',
					placeholder: 'Choose status...',
					options: [
						{ label: 'Draft', value: 'draft' },
						{ label: 'In Review', value: 'in_review' },
						{ label: 'Published', value: 'published' },
						{ label: 'Archived', value: 'archived' },
						{ label: 'Legacy', value: 'legacy' },
					],
				},
			},
		},
		dataConfig: { title: '', status: undefined },
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
	render: (args) => (
		<FormContainer {...args}>
			<UpdateSchemaDemo />
		</FormContainer>
	),
};

/** Demonstrates updateFieldSchema: buttons dynamically set label, placeholder, description on the Title field. */
function UpdateLabelPlaceholderDescriptionDemo() {
	const { updateFieldSchema } = useForm();
	return (
		<div className="flex flex-wrap items-center gap-2 rounded-md border border-muted-foreground/30 border-dashed bg-muted/30 px-3 py-2 text-sm">
			<span className="font-medium text-muted-foreground">
				updateFieldSchema (label / placeholder / description):
			</span>
			<button
				type="button"
				onClick={() =>
					updateFieldSchema?.('title', {
						uiProps: {
							label: 'Project Name (updated)',
							placeholder: 'Enter project name...',
							description: 'A short name for your project.',
						},
					})
				}
				className="rounded bg-primary px-2 py-1 text-primary-foreground hover:opacity-90"
			>
				Set custom label / placeholder / description
			</button>
			<button
				type="button"
				onClick={() =>
					updateFieldSchema?.('title', {
						uiProps: {
							label: 'Title',
							placeholder: 'Type here...',
							description: undefined,
						},
					})
				}
				className="rounded border border-input bg-background px-2 py-1 hover:bg-accent"
			>
				Reset to defaults
			</button>
		</div>
	);
}

export const UpdateLabelPlaceholderDescription: Story = {
	name: 'Update Label, Placeholder, Description',
	args: {
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Title',
					placeholder: 'Type here...',
					description: 'Initial description for the title field.',
					validation: {
						type: 'required',
						errorMessage: 'Title is required',
					},
				},
			},
		},
		dataConfig: { title: '' },
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
	render: (args) => (
		<FormContainer {...args}>
			<UpdateLabelPlaceholderDescriptionDemo />
		</FormContainer>
	),
};

/** Select options populated from externalData via uiProps.optionsKey. */
export const DynamicOptionsFromExternalData: Story = {
	name: 'Dynamic Options (externalData)',
	args: {
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Project Title',
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
				},
				role: {
					widget: 'select',
					label: 'Role',
					placeholder: 'Choose role...',
					uiProps: { optionsKey: 'availableRoles' },
				},
				tags: {
					widget: 'select',
					label: 'Tags',
					multiple: true,
					placeholder: 'Pick tags...',
					uiProps: { maxItems: 5, optionsKey: 'availableTags' },
				},
			},
		},
		dataConfig: {
			title: '',
			role: undefined,
			tags: [],
		},
		externalData: {
			availableRoles: [
				{ label: 'Admin', value: '1' },
				{ label: 'Editor', value: '2' },
				{ label: 'Viewer', value: '3' },
			],
			availableTags: [
				{ label: 'React', value: 'react' },
				{ label: 'TypeScript', value: 'typescript' },
				{ label: 'Form', value: 'form' },
			],
		},
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
};

/** Form with 30 fields: text, number, select, multi-select; some with autoSave: false. */
export const MultipleFields: Story = {
	name: 'Multiple Fields (30)',
	args: {
		isDebug: true,
		...createManyFieldsSchema(30),
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Form with 30 fields using all widgets (text, number, select, multi-select). About 30% of fields have autoSave: false (Commit/Discard). Use with isDebug to see per-field render counts (R:N).',
			},
		},
	},
};

/** Form with 50 fields for stress-testing: all widgets, some autoSave: false. */
export const MultipleFields50: Story = {
	name: 'Multiple Fields (50)',
	args: {
		isDebug: true,
		...createManyFieldsSchema(50),
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Form with 50 fields (text, number, select, multi-select); some with autoSave: false. For heavier load testing and per-field render counts.',
			},
		},
	},
};

// --- Custom / override widget demos ---

/** Simple custom widget: 1–5 star rating. Implements WidgetProps and is registered via widgets prop. */
function RatingWidget({
	label,
	value,
	onChange,
	error,
	isRequired,
	isDisabled,
}: WidgetProps) {
	const num = typeof value === 'number' && Number.isFinite(value) ? value : 0;
	const stars = [1, 2, 3, 4, 5];
	return (
		<FieldWrapper
			label={label ?? 'Rating'}
			error={error}
			isRequired={isRequired}
			isDisabled={isDisabled}
		>
			<div className="flex gap-1">
				{stars.map((n) => (
					<button
						key={n}
						type="button"
						disabled={isDisabled}
						className={`rounded border px-2 py-1 text-sm transition-colors ${
							n <= num
								? 'border-amber-500 bg-amber-100 text-amber-800'
								: 'border-input bg-background hover:bg-muted'
						}`}
						onClick={() => onChange(n)}
						aria-label={`${n} star${n > 1 ? 's' : ''}`}
					>
						★
					</button>
				))}
			</div>
		</FieldWrapper>
	);
}

/** Override widget: custom-styled text input. Same contract as default text but different look. */
function CustomStyledTextWidget(props: WidgetProps) {
	const { label, value, onChange, error, isRequired, isDisabled, placeholder } =
		props;
	const val = value == null ? '' : String(value);
	return (
		<FieldWrapper
			label={label ?? ''}
			error={error}
			isRequired={isRequired}
			isDisabled={isDisabled}
		>
			<input
				type="text"
				value={val}
				onChange={(e) => onChange(e.target.value)}
				disabled={isDisabled}
				placeholder={placeholder ?? ''}
				className="w-full rounded-lg border-2 border-primary/30 border-dashed bg-primary/5 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
			/>
		</FieldWrapper>
	);
}

/** Form using a custom "rating" widget registered via widgets prop. */
export const CustomWidget: Story = {
	name: 'Custom Widget (rating)',
	args: {
		schema: {
			fields: {
				title: {
					widget: 'text',
					label: 'Title',
					validation: {
						type: 'required',
						errorMessage: 'Title is required',
					},
				},
				satisfaction: {
					widget: 'rating',
					label: 'Satisfaction (1–5)',
				},
			},
		},
		dataConfig: { title: '', satisfaction: 0 },
		widgets: { ...DefaultWidgets, rating: RatingWidget },
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Adds a custom "rating" widget by passing widgets={{ ...DefaultWidgets, rating: RatingWidget }}. The rating field uses widget: "rating" in the schema.',
			},
		},
	},
};

/** Form that overrides the default "text" widget with a custom-styled one. */
export const OverrideWidget: Story = {
	name: 'Override Widget (custom text)',
	args: {
		schema: {
			fields: {
				name: {
					widget: 'text',
					label: 'Name',
					placeholder: 'Your name (custom-styled)',
					validation: {
						type: 'required',
						errorMessage: 'Name is required',
					},
				},
				notes: {
					widget: 'text',
					label: 'Notes',
					placeholder: 'Also using overridden text widget',
				},
			},
		},
		dataConfig: { name: '', notes: '' },
		widgets: { ...DefaultWidgets, text: CustomStyledTextWidget },
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Overrides the built-in "text" widget with a custom component (different border/background). Pass widgets={{ ...DefaultWidgets, text: CustomStyledTextWidget }}.',
			},
		},
	},
};

/**
 * Custom widget with validation, visibility, and disabled driven by schema (same as DefaultWidgets).
 * - Validation: rating is required; submit with it visible and empty to see error.
 * - Visibility: rating is only visible when "Show rating?" is "Yes".
 * - Disabled: rating is disabled when "Disable rating?" is "Yes".
 */
export const CustomWidgetValidationVisibilityDisabled: Story = {
	name: 'Custom Widget (validation, visibility, disabled)',
	args: {
		schema: {
			fields: {
				showRating: {
					widget: 'select',
					label: 'Show rating?',
					options: [
						{ label: 'Yes', value: 'yes' },
						{ label: 'No', value: 'no' },
					],
					placeholder: 'Choose...',
				},
				lockRating: {
					widget: 'select',
					label: 'Disable rating?',
					options: [
						{ label: 'Yes', value: 'yes' },
						{ label: 'No', value: 'no' },
					],
					placeholder: 'Choose...',
				},
				rating: {
					widget: 'rating',
					label: 'Satisfaction (1–5)',
					validation: {
						operator: 'and',
						rules: [
							{ type: 'required', errorMessage: 'Please give a rating' },
							{
								type: 'min',
								value: 1,
								errorMessage: 'Please give a rating (at least 1 star)',
							},
						],
					},
					rules: [
						{
							effect: 'SHOW',
							condition: {
								field: 'showRating',
								operator: '===',
								value: 'yes',
							},
						},
						{
							effect: 'DISABLE',
							condition: {
								field: 'lockRating',
								operator: '===',
								value: 'yes',
							},
						},
					],
				},
			},
		},
		dataConfig: {
			showRating: 'no',
			lockRating: 'no',
			rating: 0,
		},
		widgets: { ...DefaultWidgets, rating: RatingWidget },
		onSave: async (_data) => {
			await new Promise((r) => setTimeout(r, 500));
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Custom rating widget with schema-driven validation (required), visibility (SHOW when "Show rating?" is Yes), and disabled (DISABLE when "Disable rating?" is Yes). Verifies custom widgets receive error, isRequired, isDisabled, isVisible like DefaultWidgets.',
			},
		},
	},
};
