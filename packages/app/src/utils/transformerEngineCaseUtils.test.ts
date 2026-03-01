import { describe, expect, it } from 'vitest'
import {
  toCamelCase,
  toConstantCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
} from '@/utils/transformerEngineCaseUtils'

describe('transformerEngineCaseUtils', () => {
  it('converts to camelCase', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld')
    expect(toCamelCase('hello_world-test')).toBe('helloworldTest')
  })

  it('converts to snake_case', () => {
    expect(toSnakeCase('helloWorld')).toBe('hello_world')
    expect(toSnakeCase('Hello World')).toBe('hello_world')
  })

  it('converts to kebab-case', () => {
    expect(toKebabCase('helloWorld')).toBe('hello-world')
    expect(toKebabCase('Hello_World')).toBe('hello-world')
  })

  it('converts to PascalCase', () => {
    expect(toPascalCase('hello world')).toBe('HelloWorld')
    expect(toPascalCase('hello-world_test')).toBe('HelloWorldTest')
  })

  it('converts to CONSTANT_CASE', () => {
    expect(toConstantCase('helloWorld')).toBe('HELLO_WORLD')
    expect(toConstantCase('hello world')).toBe('HELLO_WORLD')
  })
})
