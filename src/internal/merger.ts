/**
 * CSP rule merging utilities
 * Handles merging and deduplication of CSP directives
 */

import type { CspRule } from "./types";

// const DANGEROUS_VALUES = new Set(["'unsafe-eval'", "'unsafe-inline'", '*']);
const DANGEROUS_IN_PROD = new Set(["'unsafe-eval'"]);

// CSP directives that should not have 'self' auto-added
const DIRECTIVES_WITHOUT_SELF = new Set([
	"report-uri",
	"report-to",
	"sandbox",
	"upgrade-insecure-requests",
	"block-all-mixed-content",
	"require-trusted-types-for",
	"trusted-types",
]);

/**
 * Validates CSP values and warns about dangerous configurations
 * @param directive - The CSP directive name
 * @param value - The CSP value to validate
 * @param isDev - Whether in development mode
 * @param ruleDescription - Optional description of the rule for better error messages
 */
function validateCspValue(directive: string, value: string, isDev: boolean, ruleDescription?: string): void {
	const ruleInfo = ruleDescription ? ` (Rule: ${ruleDescription})` : "";

	// Check for dangerous values in production
	if (!isDev && DANGEROUS_IN_PROD.has(value)) {
		// biome-ignore lint/suspicious/noConsole: Security warnings are intentional
		console.warn(
			`[@enalmada/start-secure] WARNING: Dangerous CSP value "${value}" in "${directive}" for production.` +
				` This significantly weakens security.${ruleInfo}`,
		);
	}

	// Check for wildcards
	if (value === "*") {
		// biome-ignore lint/suspicious/noConsole: Security warnings are intentional
		console.warn(
			`[@enalmada/start-secure] WARNING: Wildcard "*" in "${directive}" defeats CSP security.` +
				` Consider using specific origins.${ruleInfo}`,
		);
	}
}

/**
 * Merges multiple CSP rules with automatic deduplication
 * @param rules - Array of CSP rules to merge
 * @param isDev - Whether in development mode (for validation warnings)
 * @returns Record of directives with deduplicated values in Sets
 */
export function mergeCspRules(rules: CspRule[], isDev = false): Record<string, Set<string>> {
	const merged: Record<string, Set<string>> = {};

	for (const rule of rules) {
		for (const [key, value] of Object.entries(rule)) {
			// Skip non-CSP fields
			if (key === "description" || key === "source" || value === undefined) {
				continue;
			}

			if (!merged[key]) {
				merged[key] = new Set();
			}

			// Handle boolean, array, and string values
			let values: string[];
			if (typeof value === "boolean") {
				if (!value) continue; // Skip false values
				values = [""]; // true becomes empty string (directive with no value)
			} else if (Array.isArray(value)) {
				// Trim whitespace from array values and filter out empty strings
				values = value.map((v) => v.trim()).filter((v) => v !== "");
			} else if (value === "") {
				// Empty string means boolean directive
				values = [""];
			} else {
				values = value.split(/\s+/).filter(Boolean);
			}

			for (const val of values) {
				// Validate CSP value (skip validation for empty string from boolean directives)
				if (val !== "") {
					validateCspValue(key, val, isDev, rule.description);
				}
				merged[key].add(val);
			}
		}
	}

	return merged;
}

/**
 * Merges default directives with user-provided rules
 * @param defaultDirectives - Default CSP directives
 * @param userRules - User-provided CSP rules
 * @param isDev - Whether in development mode (for validation warnings)
 * @returns Merged directives with Sets for deduplication
 */
export function mergeDirectivesWithDefaults(
	defaultDirectives: Record<string, string[]>,
	userRules: CspRule[],
	isDev = false,
): Record<string, Set<string>> {
	const mergedDirectives: Record<string, Set<string>> = {};

	// Initialize sets with default directives
	for (const [key, values] of Object.entries(defaultDirectives)) {
		mergedDirectives[key] = new Set(values);
	}

	// Merge user rules with validation
	const userDirectives = mergeCspRules(userRules, isDev);
	for (const [key, values] of Object.entries(userDirectives)) {
		// Skip if values is empty (happens when boolean directive is false)
		if (values.size === 0) {
			continue;
		}

		if (!mergedDirectives[key]) {
			// Only add 'self' for source-list directives, not for special directives
			if (DIRECTIVES_WITHOUT_SELF.has(key)) {
				mergedDirectives[key] = new Set();
			} else {
				mergedDirectives[key] = new Set(["'self'"]);
			}
		}
		for (const value of values) {
			mergedDirectives[key].add(value);
		}
	}

	return mergedDirectives;
}
