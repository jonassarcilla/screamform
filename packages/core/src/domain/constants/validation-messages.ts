import type { ValidationRule } from "../schema/types";

export const DEFAULT_VALIDATION_MESSAGES: Record<ValidationRule['type'], string> = {
  required: "This field is required",
  regex: "Invalid format",
  startsWith: "Must start with a specific value",
  endsWith: "Must end with a specific value",
  in: "Value not allowed",
  min: "Value is too low",
  max: "Value is too high",
  contains: "Required value missing"
} as const;