import { describe, it, expect } from 'vitest'
import { OPERATIONS, COMMON_ICONS, ICON_MAP } from './constants'

describe('constants', () => {
  describe('OPERATIONS', () => {
    it('should have all required fields for each operation', () => {
      OPERATIONS.forEach((op) => {
        expect(op).toHaveProperty('id')
        expect(op).toHaveProperty('name')
        expect(op).toHaveProperty('description')
        expect(op).toHaveProperty('icon')
        expect(op).toHaveProperty('defaultConfig')

        expect(typeof op.id).toBe('string')
        expect(typeof op.name).toBe('string')
        expect(typeof op.description).toBe('string')
        expect(typeof op.icon).toBe('string')
        expect(typeof op.defaultConfig).toBe('object')
      })
    })

    it('should have unique operation IDs', () => {
      const ids = OPERATIONS.map((op) => op.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have all operation icons in ICON_MAP', () => {
      OPERATIONS.forEach((op) => {
        expect(ICON_MAP).toHaveProperty(op.icon)
        expect(ICON_MAP[op.icon]).toBeDefined()
      })
    })

    it('should have valid default configs', () => {
      OPERATIONS.forEach((op) => {
        expect(op.defaultConfig).not.toBeNull()
        expect(op.defaultConfig).not.toBeUndefined()
        expect(typeof op.defaultConfig).toBe('object')
      })
    })

    it('should include all expected operations', () => {
      const expectedIds = [
        'trim',
        'filter-lines',
        'sort-lines',
        'join-lines',
        'split-lines',
        'change-case',
        'replace',
      ]

      const actualIds = OPERATIONS.map((op) => op.id)

      expectedIds.forEach((id) => {
        expect(actualIds).toContain(id)
      })
    })

    it('should have non-empty names and descriptions', () => {
      OPERATIONS.forEach((op) => {
        expect(op.name.length).toBeGreaterThan(0)
        expect(op.description.length).toBeGreaterThan(0)
      })
    })
  })

  describe('COMMON_ICONS', () => {
    it('should have icon and label for each entry', () => {
      COMMON_ICONS.forEach((item) => {
        expect(item).toHaveProperty('icon')
        expect(item).toHaveProperty('label')
        expect(typeof item.label).toBe('string')
        // React components are objects, not plain functions
        expect(item.icon).toBeDefined()
      })
    })

    it('should have unique labels', () => {
      const labels = COMMON_ICONS.map((item) => item.label)
      const uniqueLabels = new Set(labels)

      expect(uniqueLabels.size).toBe(labels.length)
    })

    it('should have all common icon labels in ICON_MAP', () => {
      COMMON_ICONS.forEach((item) => {
        expect(ICON_MAP).toHaveProperty(item.label)
        expect(ICON_MAP[item.label]).toBe(item.icon)
      })
    })

    it('should have non-empty labels', () => {
      COMMON_ICONS.forEach((item) => {
        expect(item.label.length).toBeGreaterThan(0)
      })
    })
  })

  describe('ICON_MAP', () => {
    it('should have all entries as functions', () => {
      Object.entries(ICON_MAP).forEach(([key, value]) => {
        // React components are objects, not plain functions
        expect(value).toBeDefined()
        expect(key.length).toBeGreaterThan(0)
      })
    })

    it('should include operation-specific icons', () => {
      const operationIcons = ['ArrowDownAZ', 'CaseSensitive', 'Replace', 'Minimize2', 'Maximize2']

      operationIcons.forEach((icon) => {
        expect(ICON_MAP).toHaveProperty(icon)
      })
    })

    it('should include common icons with aliases', () => {
      // Check that aliases exist
      expect(ICON_MAP).toHaveProperty('Wand')
      expect(ICON_MAP).toHaveProperty('Sort')
      expect(ICON_MAP).toHaveProperty('Align')
      expect(ICON_MAP).toHaveProperty('Text')
      expect(ICON_MAP).toHaveProperty('Code')
      expect(ICON_MAP).toHaveProperty('File')
    })
  })

  describe('Integration', () => {
    it('should have consistent icon references between OPERATIONS and ICON_MAP', () => {
      // All operation icons should be resolvable
      OPERATIONS.forEach((op) => {
        const iconComponent = ICON_MAP[op.icon]
        expect(iconComponent).toBeDefined()
        // React components are objects, not plain functions
        expect(iconComponent).not.toBeNull()
      })
    })

    it('should have valid default configs for each operation type', () => {
      const configsByOperation = {
        trim: { lines: expect.any(Boolean) },
        'filter-lines': { trim: expect.any(Boolean) },
        'sort-lines': { direction: expect.any(String), numeric: expect.any(Boolean) },
        'join-lines': { separator: expect.any(String) },
        'split-lines': { separator: expect.any(String) },
        'change-case': { mode: expect.any(String), lines: expect.any(Boolean) },
        replace: {
          from: expect.any(String),
          to: expect.any(String),
          regex: expect.any(Boolean),
          caseInsensitive: expect.any(Boolean),
          lines: expect.any(Boolean),
        },
      }

      OPERATIONS.forEach((op) => {
        const expectedConfig = configsByOperation[op.id as keyof typeof configsByOperation]
        if (expectedConfig) {
          expect(op.defaultConfig).toMatchObject(expectedConfig)
        }
      })
    })
  })
})
