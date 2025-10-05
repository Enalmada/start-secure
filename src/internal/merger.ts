/**
 * CSP rule merging utilities
 * Handles merging and deduplication of CSP directives
 */

import type { CspRule } from './types';

/**
 * Merges multiple CSP rules with automatic deduplication
 * @param rules - Array of CSP rules to merge
 * @returns Record of directives with deduplicated values in Sets
 */
export function mergeCspRules(rules: CspRule[]): Record<string, Set<string>> {
  const merged: Record<string, Set<string>> = {};

  for (const rule of rules) {
    for (const [key, value] of Object.entries(rule)) {
      // Skip non-CSP fields
      if (key === 'description' || key === 'source' || value === undefined) {
        continue;
      }

      if (!merged[key]) {
        merged[key] = new Set();
      }

      // Handle both array and string values
      const values = Array.isArray(value) ? value : value.split(/\s+/).filter(Boolean);
      for (const val of values) {
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
 * @returns Merged directives with Sets for deduplication
 */
export function mergeDirectivesWithDefaults(
  defaultDirectives: Record<string, string[]>,
  userRules: CspRule[]
): Record<string, Set<string>> {
  const mergedDirectives: Record<string, Set<string>> = {};

  // Initialize sets with default directives
  for (const [key, values] of Object.entries(defaultDirectives)) {
    mergedDirectives[key] = new Set(values);
  }

  // Merge user rules
  const userDirectives = mergeCspRules(userRules);
  for (const [key, values] of Object.entries(userDirectives)) {
    if (!mergedDirectives[key]) {
      // If directive doesn't exist in defaults, initialize with 'self'
      mergedDirectives[key] = new Set(["'self'"]);
    }
    for (const value of values) {
      mergedDirectives[key].add(value);
    }
  }

  return mergedDirectives;
}
