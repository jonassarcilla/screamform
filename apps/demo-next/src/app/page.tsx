"use client";

import { useRef, useMemo } from "react";
import {
  FormContainer,
  FormProvider,
  useFormEngine,
  FieldRenderer,
  useValue,
  DefaultWidgets,
} from "@screamform/react";
import type { WidgetProps, WidgetRegistry } from "@screamform/react";
import type { UISchema } from "@screamform/core";

const dataConfig: Record<string, unknown> = {};

/** Custom widget: 1–5 star rating. Uses types from @screamform/react. */
function RatingWidget({
  label,
  value,
  onChange,
  error,
  isRequired,
  isDisabled,
}: WidgetProps) {
  const num = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="grid w-full gap-1.5">
      <label className="text-sm font-medium leading-none">
        {label ?? "Rating"}
        {isRequired && <span className="text-destructive font-bold">*</span>}
      </label>
      <div className="flex gap-1">
        {stars.map((n) => (
          <button
            key={n}
            type="button"
            disabled={isDisabled}
            className={`rounded border px-2 py-1 text-sm transition-colors ${
              n <= num
                ? "border-amber-500 bg-amber-100 text-amber-800"
                : "border-input bg-background hover:bg-muted"
            }`}
            onClick={() => onChange(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>
      {error && (
        <p className="text-[0.8rem] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

/** Override widget: custom-styled text. Same contract as default text. */
function CustomStyledText(props: WidgetProps) {
  const { label, value, onChange, error, isRequired, isDisabled, placeholder } =
    props;
  const val = value == null ? "" : String(value);
  return (
    <div className="grid w-full gap-1.5">
      <label className="text-sm font-medium leading-none">
        {label ?? ""}
        {isRequired && <span className="text-destructive font-bold">*</span>}
      </label>
      <input
        type="text"
        value={val}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        placeholder={placeholder ?? ""}
        className="w-full rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
      />
      {error && (
        <p className="text-[0.8rem] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

const schema: UISchema = {
  fields: {
    name: {
      label: "Name",
      widget: "text",
      placeholder: "Your name",
      validation: {
        type: "required",
        errorMessage: "Name is required",
      },
    },
    age: {
      label: "Age",
      widget: "number",
      placeholder: "0",
      validation: {
        operator: "and",
        rules: [
          { type: "min", value: 0, errorMessage: "Age must be at least 0" },
          { type: "max", value: 150, errorMessage: "Age must be at most 150" },
        ],
      },
    },
    country: {
      label: "Country",
      widget: "select",
      options: [
        { label: "USA", value: "us" },
        { label: "UK", value: "uk" },
        { label: "Other", value: "other" },
      ],
      validation: {
        type: "required",
        errorMessage: "Please select a country",
      },
    },
    tags: {
      label: "Tags",
      widget: "multi-select",
      options: [
        { label: "React", value: "react" },
        { label: "Next.js", value: "next" },
        { label: "TypeScript", value: "ts" },
      ],
    },
    title: {
      widget: "text",
      label: "Project Title",
      validation: {
        type: "required",
        errorMessage: "Project title is required",
      },
    },
    budget: {
      widget: "number",
      label: "Budget Limit",
      validation: {
        type: "required",
        errorMessage: "Budget is required",
      },
    },
  },
};

const customWidgetsSchema: UISchema = {
  fields: {
    productName: {
      widget: "text",
      label: "Product name (overridden text)",
      placeholder: "Uses CustomStyledText",
      validation: {
        type: "required",
        errorMessage: "Required",
      },
    },
    satisfaction: {
      widget: "rating",
      label: "Satisfaction (1–5)",
    },
  },
};

const customWidgetsDataConfig: Record<string, unknown> = {
  productName: "",
  satisfaction: 0,
};

const customWidgetsRegistry: Partial<WidgetRegistry> = {
  ...DefaultWidgets,
  rating: RatingWidget,
  text: CustomStyledText,
};

function CustomFormSection({
  onSave,
}: {
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const {
    formState$,
    toolbarState$,
    formFieldStates$,
    formVersion$,
    submitErrors$,
    actions,
  } = useFormEngine(schema, dataConfig, { isDebug: false });

  const engineRef = useRef({
    formState$,
    toolbarState$,
    formFieldStates$,
    formVersion$,
    submitErrors$,
  });
  engineRef.current = {
    formState$,
    toolbarState$,
    formFieldStates$,
    formVersion$,
    submitErrors$,
  };

  const contextValue = useMemo(
    () => ({
      getEngine: () => engineRef.current,
      actions,
      externalData:
        undefined as
          | Record<string, Array<{ label: string; value: unknown }>>
          | undefined,
      isDebug: false,
    }),
    [actions],
  );

  const fieldKeys = useMemo(() => Object.keys(schema.fields), []);
  const snapshot = useValue(() => toolbarState$.get());
  const canSave =
    snapshot.hasFormChanges &&
    !snapshot.isFormDirty &&
    !snapshot.isSubmitting;
  const canReset =
    !snapshot.isFormDirty &&
    !snapshot.isSubmitting &&
    snapshot.hasHistoryEntries;

  const handleSave = async () => {
    await actions.submit(onSave);
  };

  const handleReset = () => {
    if (window.confirm("Reset form? This will clear your undo history.")) {
      actions.reset();
    }
  };

  return (
    <FormProvider value={contextValue}>
      <div className="max-w-2xl mx-auto p-6 border rounded-xl border-dashed border-muted-foreground/30 space-y-6">
        <h2 className="text-xl font-bold">Custom form (no FormContainer)</h2>
        <p className="text-sm text-muted-foreground">
          Same schema and engine; layout and buttons are custom. Uses
          useFormEngine + FormProvider + FieldRenderer.
        </p>
        {snapshot.submitErrors?._form && (
          <div className="p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
            {snapshot.submitErrors._form}
          </div>
        )}
        <div className="space-y-4">
          {fieldKeys.map((key) => (
            <FieldRenderer key={key} fieldKey={key} />
          ))}
        </div>
        <div className="pt-6 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={!canReset}
            className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="px-6 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </FormProvider>
  );
}

export default function Home() {
  const handleSave = async (data: Record<string, unknown>) => {
    console.log("Saved:", data);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl space-y-12">
        <h1 className="mb-6 text-2xl font-semibold">Screamform Demo</h1>

        <section>
          <h2 className="text-lg font-semibold mb-4">With FormContainer</h2>
          <FormContainer
            schema={schema}
            dataConfig={dataConfig}
            onSave={handleSave}
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Custom form</h2>
          <CustomFormSection onSave={handleSave} />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">
            Custom widget + override widget
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Uses <code className="rounded bg-muted px-1">DefaultWidgets</code>,{" "}
            <code className="rounded bg-muted px-1">WidgetProps</code>, and{" "}
            <code className="rounded bg-muted px-1">WidgetRegistry</code> from
            @screamform/react. Custom &quot;rating&quot; widget and overridden
            &quot;text&quot; widget.
          </p>
          <FormContainer
            schema={customWidgetsSchema}
            dataConfig={customWidgetsDataConfig}
            widgets={customWidgetsRegistry}
            onSave={handleSave}
          />
        </section>
      </div>
    </main>
  );
}
