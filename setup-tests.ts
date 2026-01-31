import { plugin } from "bun";
import typia from "bun-plugin-typia";

// Register the plugin to transform Typia calls on the fly
plugin(typia());