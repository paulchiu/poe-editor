/**
 * Converts a string to camelCase format.
 * @param value - The input string to convert.
 * @returns The camelCase formatted string.
 */
export function toCamelCase(value: string): string {
  return value
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '')
    .replace(/[-_]+/g, '')
}

/**
 * Converts a string to snake_case format.
 * @param value - The input string to convert.
 * @returns The snake_case formatted string.
 */
export function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

/**
 * Converts a string to kebab-case format.
 * @param value - The input string to convert.
 * @returns The kebab-case formatted string.
 */
export function toKebabCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Converts a string to PascalCase format.
 * @param value - The input string to convert.
 * @returns The PascalCase formatted string.
 */
export function toPascalCase(value: string): string {
  return value
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(/\s+(.)(\w*)/g, (_match, first, rest) => `${first.toUpperCase() + rest.toLowerCase()}`)
    .replace(new RegExp(/\w/), (char) => char.toUpperCase())
}

/**
 * Converts a string to CONSTANT_CASE format.
 * @param value - The input string to convert.
 * @returns The CONSTANT_CASE formatted string.
 */
export function toConstantCase(value: string): string {
  return toSnakeCase(value).toUpperCase()
}
