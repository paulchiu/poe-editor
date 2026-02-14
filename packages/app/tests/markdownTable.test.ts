
import { describe, it, expect } from 'vitest'
import { formatMarkdownTable } from '../src/utils/markdownTable'

describe('formatMarkdownTable', () => {
  it('formats a simple table', () => {
    const input = `
| h1 | h2 |
|---|---|
| v1 | v2 |
`.trim()
    const expected = `| h1  | h2  |
| --- | --- |
| v1  | v2  |`
    expect(formatMarkdownTable(input)).toBe(expected)
  })

  it('aligns columns with padding', () => {
    const input = `
| Name | Age |
|---|---|
| Alice | 25 |
| Bob | 30 |
`.trim()
    const expected = `| Name  | Age |
| ----- | --- |
| Alice | 25  |
| Bob   | 30  |`
    expect(formatMarkdownTable(input)).toBe(expected)
  })

  it('handles wide CJK characters', () => {
    const input = `
| 名字 | 年龄 |
|---|---|
| 张三 | 25 |
| Li | 30 |
`.trim()
    // 名字 (4 width) | 年龄 (4 width)
    // 张三 (4 width) | 25 (2 width) -> pad to 4 -> 25__
    // Li (2 width)   | 30 (2 width) -> pad to 4 -> 30__
    // Max cols: 4, 4
    
    const expected = `| 名字 | 年龄 |
| ---- | ---- |
| 张三 | 25   |
| Li   | 30   |`
    expect(formatMarkdownTable(input)).toBe(expected)
  })

  it('preserves alignment markers', () => {
    const input = `
| Left | Center | Right |
| :--- | :---: | ---: |
| 1 | 2 | 3 |
`.trim()
    
    // Left (4) | Center (6) | Right (5)
    // 1 (1) -> 1___ | 2 (1) -> 2_____ | 3 (1) -> 3____
    
    const expected = `| Left | Center | Right |
| :--- | :----: | ----: |
| 1    | 2      | 3     |`
    expect(formatMarkdownTable(input)).toBe(expected)
  })
  
  it('handles empty cells', () => {
      const input = `
| A | B |
|---|---|
| 1 | |
| | 2 |
`.trim()
    const expected = `| A   | B   |
| --- | --- |
| 1   |     |
|     | 2   |`
    expect(formatMarkdownTable(input)).toBe(expected)
  })
})
