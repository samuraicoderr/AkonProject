/**
 * Utility functions for the application
 */

type ClassValue = string | number | boolean | undefined | null | ClassValue[];

/**
 * Combine class names conditionally (like clsx/classnames)
 */
export function cn(...classes: ClassValue[]): string {
  return classes
    .flat()
    .filter((x) => typeof x === "string" && x.length > 0)
    .join(" ");
}

/**
 * Interpret server error responses
 */
export function interpretServerError(
  error: unknown,
  seen = new WeakSet()
): string[] {
  const messages: string[] = [];

  if (error && typeof error === "object") {
    if (seen.has(error)) return messages; // prevent infinite recursion
    seen.add(error);

    for (const key of Object.keys(error)) {
      const value = (error as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        messages.push(...value.map(String));
      } else if (typeof value === "string") {
        messages.push(value);
      } else if (typeof value === "object" && value !== null) {
        messages.push(...interpretServerError(value, seen));
      } else if (value != null) {
        messages.push(String(value));
      }
    }
  }

  return messages;
}

/**
 * Format a number with commas as thousands separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
