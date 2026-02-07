"use client";

import { useRef, useMemo } from "react";
import {
  FormContainer,
  FormProvider,
  useFormEngine,
  FieldRenderer,
  useValue,
} from "@screamform/react";
import type { UISchema } from "@screamform/core";

const dataConfig: Record<string, unknown> = {};

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
      </div>
    </main>
  );
}
