# Screamform Roadmap

## Phase 1 — Core Foundation (complete)

Everything below is implemented, tested, and working.

### @screamform/core

- **Schema system** — `UISchema`, `UISchemaField`, recursive `ValidationRule`/`LogicGroup` types
- **Rules engine** — `evaluateLogic()` with operators: `===`, `!==`, `>`, `<`, `>=`, `<=`, `contains`, `empty`, `startsWith`, `endsWith`, `in`; supports nested AND/OR/NOT groups
- **Validation engine** — `evaluateValidation()` with rules: `required`, `regex`, `min`, `max`, `contains`, `startsWith`, `endsWith`, `in`; recursive AND/OR/NOT groups
- **Builder API** — fluent `FormBuilder` / `FieldBuilder` / `SectionBuilder` with standalone factories (`createTextField`, `createNumberField`, etc.)
- **Path resolver** — dot notation (`user.firstName`), bracket notation (`items[0].name`), nested get/set without mutation
- **Data sanitization** — coercion, filtering, unflattening via `sanitizeFormData()`
- **Use cases** — `getFieldState()`, `captureInput()`, `processSubmission()`, `handleAutoSave()`, `discardChanges()`
- **Security** — `deepFreeze()`, `getPIIFields()`, `validateSchema()`, data classification (`public`/`internal`/`confidential`/`pii`)
- **Tests** — 22 test files covering builder, domain, use cases, and utilities

### @screamform/react

- **FormContainer** — top-level component: auto-save, manual commit/discard, undo/redo history, beforeunload warning, React Profiler debug mode
- **FieldRenderer** — per-field rendering with fine-grained Legend-State subscriptions
- **FieldWrapper** — label, error display, commit/discard buttons, markdown description popover, data-type badges
- **HistoryToolbar** — undo/redo controls with dirty-state indicator
- **Widgets** — `TextInput` (with autosuggestions), `NumberInput`, `SelectInput` (single + multi with combobox search), `SectionWidget` (nested fields)
- **Widget registry** — extensible `Record<string, ComponentType<WidgetProps>>`, custom widgets via `widgets` prop
- **State engine** — `useFormEngine()` hook backed by Legend-State observables; working data vs committed data, history stack, form version tracking
- **Context** — `useFormField()`, `useFormActions()`, `useFormMeta()`, `useWidgetRegistry()` for fine-grained subscriptions
- **Stories** — FormContainer and Builder API Storybook stories
- **Tests** — 7 test files covering lifecycle, auto-save, undo/redo, sections

---

## Phase 2 — Subforms, Widgets & Validation

> Goal: add subforms (reusable fragments, repeatable arrays, wizard steps), complete the widget set, and harden validation. Use JSON Schema-compatible keywords for all new additions.

### 2.1 Subforms — Schema & Validation

- [ ] **Field-level meta** — add optional `SchemaMeta` (id, version, author) to `UISchemaField` for subform identity
- [ ] **Independent subform validation** — subforms validate against their own data scope; errors propagate to parent only when the subform has a `required` rule; recursive cascading for arbitrary nesting depth
- [ ] **Reusable fragments** — `definitions` + `$ref` on `UISchema` / `UISchemaField`; `resolveRefs()` utility; `FormBuilder.defineFragment()` + `SectionBuilder.useFragment()`
- [ ] **Enhanced conditional sections** — rules evaluator uses `PathResolver.get()` for nested field references (e.g. `showWhen('billing.country', '===', 'US')`)
- [ ] **Template pipes** — extend existing template syntax with format pipes: `{value|date:FORMAT}`, `{value|number:FORMAT}`, `{value|uppercase}`, etc. Used by date picker, List/Table columns, and field-level templates. Powered by `Intl.DateTimeFormat` / `Intl.NumberFormat` — zero dependencies

### 2.2 Repeatable array fields

- [ ] **ArrayWidget** — renders `children[]` with add/remove/reorder UI; respects `minItems`/`maxItems`
- [ ] **Array engine actions** — `addArrayItem()`, `removeArrayItem()`, `moveArrayItem()` in `use-form-engine`
- [ ] **Array item isolation** — each item validates independently

### 2.3 Multi-step wizard forms

- [ ] **Wizard schema** — `FormStep` type + `steps[]` on `UISchema`; `FormBuilder.addStep()`
- [ ] **Wizard components** — `FormWizard` + `FormStep` with step navigation, progress indicator
- [ ] **Wizard engine** — `currentStep$`, `nextStep()`, `prevStep()`, `goToStep()`, per-step validation via `validateSection()`

### 2.4 Missing widgets

- [ ] **Boolean input** — `BooleanInput` with `uiProps.variant: 'checkbox' | 'toggle'` (stub commented out in registry); checkbox is default, toggle for settings-style switches
- [ ] **Textarea** — multi-line text with character count
- [ ] **Password** — masked input with show/hide toggle, optional strength indicator
- [ ] **Date picker** — native or Radix-based; display and output formatting via template pipes (e.g. `{value|date:DD MMM YYYY}` for display, `{value|date:YYYY-MM-DD}` for output); defaults: display `MM/DD/YYYY`, output `YYYY-MM-DD` (ISO 8601)
- [ ] **Radio group** — single-select alternative to dropdown
- [ ] **Slider / Range** — numeric input with min/max/step
- [ ] **OTP input** — row of individual character boxes; `uiProps.otpLength` configurable (default 6); auto-focus next box on input, backspace moves back; produces a single concatenated string value
- [ ] **Cron input** — cron expression builder; text input with human-readable preview (e.g. `"0 9 * * MON-FRI"` shows "Every weekday at 9:00 AM"); optional visual picker for minute/hour/day/month/weekday; validates cron syntax; outputs standard 5-field cron string
- [ ] **CIDR input** — IP address / subnet input; validates IPv4 and IPv6 CIDR notation (e.g. `"10.0.0.0/24"`, `"2001:db8::/32"`); optional subnet info preview (network range, usable hosts); outputs CIDR string
- [ ] **File upload** — drag-and-drop zone, file type/size validation
- [ ] Register all new widgets in `DefaultWidgets`

### 2.5 Confidential field encryption

- [ ] **Encryption timing based on autoSave:**
  - `autoSave: false` — encrypt on commit (user clicks commit, then value is encrypted and masked)
  - `autoSave: true` (default) — encrypt on change, debounced (avoid API spam on every keystroke); mask after debounce settles
- [ ] **Post-encryption masking** — after encryption completes, replace the client value with a placeholder (e.g. `••••••••`); the real value is no longer accessible client-side
- [ ] **No show/hide** — unlike password widget, confidential values cannot be revealed after encryption
- [ ] **Engine hook** — `onEncrypt?: (fieldKey, value) => Promise<string>` callback on FormContainer for API integration; debounce interval configurable via `settings.encryptDebounceMs` (default ~800ms)
- [ ] **Fallback** — if `onEncrypt` is not provided, fall back to base64 encoding. If `onEncrypt` is provided but the API call fails, reset the field to empty and surface a validation error on the field (e.g. "Encryption failed. Please try again.")
- [ ] **Encryption status** — field state tracks `encrypted: boolean` so widgets render correctly (placeholder vs editable)

### 2.6 Advanced validation

- [ ] **Async validation** — server-side checks (e.g. "is username taken?") with loading/debounce state
- [ ] **Cross-field validation** — rules that reference other field values (e.g. "end date > start date")
- [ ] **Custom validator functions** — user-supplied `(value, allValues) => string | null`
- [ ] Surface validation errors per-field and at form level

### 2.7 Accessibility (WCAG 2.1 AA)

- [ ] Full ARIA labelling on all widgets (label, description, error)
- [ ] Keyboard navigation audit (tab order, arrow keys in selects/radios)
- [ ] Screen reader announcements for validation errors and state changes
- [ ] Focus management on add/remove array items
- [ ] High-contrast / forced-colors support

### 2.8 Testing

- [ ] E2E tests with Playwright (setup exists, needs test cases)
- [ ] Visual regression tests via Storybook + Chromatic or similar
- [ ] Accessibility automated checks (`@storybook/addon-a11y` is installed)

---

## Phase 3 — DX, Performance & Distribution (future)

### 3.1 JSON Schema compliance (zero new dependencies)

- [ ] Split into standard JSON Schema (data/validation) + separate UI schema (rendering/behavior)
- [ ] Data validation keywords: `type`, `required`, `pattern`, `minimum`, `maximum`, `format`, `enum`
- [ ] UI schema layer: `widget`, `label`, `placeholder`, `rules`, `autoSave`, `sensitivity`, etc.
- [ ] Builder API abstracts the split — developers work with one builder, engine merges both
- [ ] Update existing `evaluateValidation()` to understand JSON Schema keywords (no external validator — keyword mapping only)
- [ ] Extend existing `validateSchema()` for the new split format (no external validator)
- [ ] `jsonSchemaToUISchema()` / `uiSchemaToJsonSchema()` converters

### 3.2 Read-only data widgets (List / Table / Grid)

- [ ] **Shared `useDataView` base** — data source from `externalData` or field value, search/filter, pagination (`uiProps.pageSize`), row selection (single/multi), `uiProps.valueKey` for stored value, empty/loading states
- [ ] **List** — single-column rich item display; item layout via template slots (`itemTitle`, `itemSubtitle`, `itemMeta`, etc.) using template pipes
- [ ] **Table** — multi-column structured data; columns via `uiProps.columns` using `key` (nested path via PathResolver) or `template` with pipes; sortable columns
- [ ] **Grid** — card-based responsive layout; card content via template slots; configurable column count
- [ ] All three share the same base and integrate with Data Query builder (below)

### 3.3 Data Query builder

- [ ] **Query DSL** — declarative filter/sort/group expressions for data sets (similar to the rules engine but for data, not visibility)
- [ ] **Visual query builder** — UI component for building queries with dropdowns/conditions (AND/OR groups, operators, field pickers)
- [ ] **List/Table/Grid integration** — plug the query builder into data widgets for advanced filtering
- [ ] **External data filtering** — query builder can filter `externalData` sources (e.g. API-backed option lists, reference tables)
- [ ] Zero new dependencies — reuse existing `evaluateLogic()` patterns from the rules engine

### 3.4 Developer experience

- [ ] API reference docs (generated from TSDoc)
- [ ] Schema migration utilities (version upgrades)
- [ ] Better schema validation error messages

### 3.5 Internationalization

- [ ] i18n for labels, errors, placeholder text
- [ ] Locale-aware date/number formatting
- [ ] RTL layout support

### 3.6 Performance

- [ ] Virtual scrolling for large forms (100+ fields)
- [ ] Lazy widget loading (code-split per widget type)
- [ ] Form state persistence (localStorage / sessionStorage)
- [ ] Performance benchmarks in CI

### 3.7 Distribution

- [ ] npm publish pipeline (`@screamform/core`, `@screamform/react`)
- [ ] Changelog generation
- [ ] Versioning strategy (semver, changesets)
- [ ] CDN build (UMD/global for non-bundler usage)

---

## Phase 4 — Theming & Visual Polish (future)

> Goal: make screamform look professional out of the box and fully customizable.

### 4.1 Theme system

- [ ] **Headless-first architecture** — all widgets ship unstyled logic + default themed styles; consumers can use the logic only and bring their own UI, or use the defaults and customize via CSS variables
- [ ] **CSS variable-based theming** — all colors, spacing, radii, shadows exposed as `--sf-*` CSS custom properties; override any variable to retheme without touching source
- [ ] **Preset themes** — VS Code dark (default — developer-focused, compact, `#1e1e1e` bg, `#007acc` accents, flat inputs, minimal borders), VS Code light, neutral clean, enterprise
- [ ] **Theme switching** — `<FormContainer theme="dark" />` or `theme={customTheme}` prop; switch at runtime without remount
- [ ] **Per-widget style overrides** — `uiProps.className` already exists; add `uiProps.style` for inline overrides
- [ ] **Custom widget rendering** — widget registry already allows full replacement; consumers can swap any widget with their own component while keeping the form engine

### 4.2 Layout & spacing

- [ ] **Form layout modes** — single column (default), two-column, inline/horizontal labels
- [ ] **Field sizing** — `uiProps.width: 'full' | 'half' | 'third' | 'auto'` for grid-based field placement
- [ ] **Section styling** — bordered, card, collapsible, flat variants for sections/subforms
- [ ] **Responsive breakpoints** — fields auto-stack on mobile

### 4.3 Visual refinements

- [ ] **Animations** — smooth transitions for show/hide rules, array item add/remove, wizard step transitions
- [ ] **Error states** — polished error styling with shake animation, inline icons
- [ ] **Loading states** — skeleton loaders for async data, spinner for encryption/validation
- [ ] **Empty states** — friendly empty state illustrations for array fields with no items

### 4.4 Design tokens

- [ ] **Token export** — export theme as design tokens (JSON / Figma-compatible) for design system integration
- [ ] **Tailwind theme plugin** — optional `@screamform/tailwind` plugin that maps `--sf-*` variables to Tailwind utilities

---

## Phase 5 — VS Code Extension (future)

> Goal: ship screamform as a VS Code extension, rendering config-driven forms natively inside the editor.

### 5.1 Extension scaffold

- [ ] VS Code extension project (`@screamform/vscode`) https://www.figma.com/design/3LtUYAGWp3FQMDPeGsEAr7/Visual-Studio-Code-Toolkit--Community-?node-id=1-2&p=f&t=IZVABmQ8iovAj5J6-0
- [ ] Webview panel rendering `@screamform/react` inside VS Code
- [ ] VS Code Webview UI Toolkit integration for native look (or rely on Phase 4 VS Code theme)

### 5.2 Editor integration

- [ ] Form schemas loaded from workspace files (JSON/YAML)
- [ ] Custom editor provider — open `.screamform.json` files as rendered forms
- [ ] Command palette commands (new form, validate schema, export data)
- [ ] Settings UI — use screamform to render VS Code extension settings

### 5.3 Extension-specific features

- [ ] Side panel forms (e.g. config editors, deployment wizards)
- [ ] Tree view integration for wizard steps / form navigation
- [ ] Output channel for form submission results / validation logs
- [ ] Workspace state persistence for form data

---

## Architecture decisions (for reference)

| Decision | Rationale |
|---|---|
| Schema-first | Declarative JSON drives everything; portable across frameworks |
| Core/React split | Business logic has zero React dependency |
| Legend-State observables | Fine-grained per-field reactivity without re-rendering the whole form |
| Widget registry | Extensible; consumers override or add widgets by string key |
| Fluent builder API | Ergonomic schema construction with full type safety |
| Security-first | PII detection, data classification, deep-freeze immutability |
