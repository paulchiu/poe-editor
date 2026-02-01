import { describe, it, expect } from 'vitest'
import { createToolbarExport, parseToolbarImport, SCHEMA_VERSION } from './toolbarSchema'
import type { TransformationPipeline } from './types'

describe('toolbarSchema', () => {
  const mockPipeline: TransformationPipeline = {
    id: 'test-pipeline',
    name: 'Test Pipeline',
    icon: 'Wand',
    steps: [
      {
        id: 'step-1',
        operationId: 'trim',
        config: { lines: true },
        enabled: true,
      },
    ],
  }

  describe('createToolbarExport', () => {
    it('should create a valid export object', () => {
      const result = createToolbarExport([mockPipeline])

      expect(result).toHaveProperty('version', SCHEMA_VERSION)
      expect(result).toHaveProperty('exportedAt')
      expect(result).toHaveProperty('pipelines')
      expect(result.pipelines).toHaveLength(1)
      expect(result.pipelines[0]).toEqual(mockPipeline)
    })

    it('should create export with empty pipelines array', () => {
      const result = createToolbarExport([])

      expect(result.version).toBe(SCHEMA_VERSION)
      expect(result.pipelines).toEqual([])
    })

    it('should create export with valid ISO timestamp', () => {
      const result = createToolbarExport([mockPipeline])

      expect(result.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(() => new Date(result.exportedAt)).not.toThrow()
    })

    it('should handle multiple pipelines', () => {
      const pipeline2: TransformationPipeline = {
        id: 'test-pipeline-2',
        name: 'Test Pipeline 2',
        icon: 'Stars',
        steps: [],
      }

      const result = createToolbarExport([mockPipeline, pipeline2])

      expect(result.pipelines).toHaveLength(2)
      expect(result.pipelines[0]).toEqual(mockPipeline)
      expect(result.pipelines[1]).toEqual(pipeline2)
    })
  })

  describe('parseToolbarImport', () => {
    it('should parse valid export JSON', () => {
      const exportData = createToolbarExport([mockPipeline])
      const json = JSON.stringify(exportData)

      const result = parseToolbarImport(json)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockPipeline)
    })

    it('should parse empty pipelines array', () => {
      const exportData = createToolbarExport([])
      const json = JSON.stringify(exportData)

      const result = parseToolbarImport(json)

      expect(result).toEqual([])
    })

    it('should throw error for invalid JSON', () => {
      const invalidJson = 'not valid json {'

      expect(() => parseToolbarImport(invalidJson)).toThrow('Invalid JSON format')
    })

    it('should throw error for missing version field', () => {
      const invalidData = {
        exportedAt: new Date().toISOString(),
        pipelines: [mockPipeline],
      }
      const json = JSON.stringify(invalidData)

      expect(() => parseToolbarImport(json)).toThrow('Invalid configuration format')
    })

    it('should throw error for wrong version', () => {
      const invalidData = {
        version: 999,
        exportedAt: new Date().toISOString(),
        pipelines: [mockPipeline],
      }
      const json = JSON.stringify(invalidData)

      expect(() => parseToolbarImport(json)).toThrow('Invalid configuration format')
    })

    it('should throw error for missing exportedAt field', () => {
      const invalidData = {
        version: SCHEMA_VERSION,
        pipelines: [mockPipeline],
      }
      const json = JSON.stringify(invalidData)

      expect(() => parseToolbarImport(json)).toThrow('Invalid configuration format')
    })

    it('should throw error for invalid exportedAt format', () => {
      const invalidData = {
        version: SCHEMA_VERSION,
        exportedAt: 'not a valid date',
        pipelines: [mockPipeline],
      }
      const json = JSON.stringify(invalidData)

      expect(() => parseToolbarImport(json)).toThrow('Invalid configuration format')
    })

    it('should throw error for missing pipelines field', () => {
      const invalidData = {
        version: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
      }
      const json = JSON.stringify(invalidData)

      expect(() => parseToolbarImport(json)).toThrow('Invalid configuration format')
    })

    it('should throw error for invalid operation ID', () => {
      const invalidPipeline = {
        ...mockPipeline,
        steps: [
          {
            id: 'step-1',
            operationId: 'invalid-operation',
            config: {},
            enabled: true,
          },
        ],
      }
      const exportData = {
        version: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        pipelines: [invalidPipeline],
      }
      const json = JSON.stringify(exportData)

      expect(() => parseToolbarImport(json)).toThrow('Invalid configuration format')
    })

    it('should throw error for missing step fields', () => {
      const invalidPipeline = {
        ...mockPipeline,
        steps: [
          {
            id: 'step-1',
            operationId: 'trim',
            // missing config and enabled
          },
        ],
      }
      const exportData = {
        version: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        pipelines: [invalidPipeline],
      }
      const json = JSON.stringify(exportData)

      expect(() => parseToolbarImport(json)).toThrow('Invalid configuration format')
    })

    it('should validate all operation IDs', () => {
      const validOperations: TransformationPipeline = {
        id: 'all-ops',
        name: 'All Operations',
        icon: 'Wand',
        steps: [
          { id: '1', operationId: 'trim', config: {}, enabled: true },
          { id: '2', operationId: 'replace', config: {}, enabled: true },
          { id: '3', operationId: 'change-case', config: {}, enabled: true },
          { id: '4', operationId: 'sort-lines', config: {}, enabled: true },
          { id: '5', operationId: 'join-lines', config: {}, enabled: true },
          { id: '6', operationId: 'split-lines', config: {}, enabled: true },
          { id: '7', operationId: 'filter-lines', config: {}, enabled: true },
        ],
      }
      const exportData = createToolbarExport([validOperations])
      const json = JSON.stringify(exportData)

      const result = parseToolbarImport(json)

      expect(result).toHaveLength(1)
      expect(result[0].steps).toHaveLength(7)
    })
  })
})
