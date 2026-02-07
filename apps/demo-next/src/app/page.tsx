"use client";

import { FormContainer } from "@screamform/react";
import type { UISchema } from "@screamform/react";

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
					widget: 'text',
					label: 'Project Title',
					validation: {
						type: 'required',
						errorMessage: 'Project title is required',
					},
		},
		budget: { widget: 'number', label: 'Budget Limit', validation: {
			type: 'required',
			errorMessage: 'Budget is required',
		}},
  },
};

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold">Screamform Demo</h1>
        <FormContainer
          schema={schema}
          dataConfig={{}}
          onSave={async (data: Record<string, unknown>) => {
            console.log("Saved:", data);
          }}
        />
      </div>
    </main>
  );
}
