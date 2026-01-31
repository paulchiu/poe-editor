import { useState, useCallback } from 'react'
import type { TransformationPipeline } from '@/components/formatter/types'

const STORAGE_KEY = 'poe-editor-pipelines'

interface UseFormattersReturn {
  pipelines: TransformationPipeline[]
  addPipeline: (pipeline: TransformationPipeline) => void
  updatePipeline: (pipeline: TransformationPipeline) => void
  removePipeline: (id: string) => void
  replacePipelines: (newPipelines: TransformationPipeline[]) => void
  loaded: boolean
}

/**
 * Gets initial pipelines from localStorage or URL param clear.
 * @returns Array of saved transformation pipelines
 */
function getInitialPipelines(): TransformationPipeline[] {
  if (typeof window === 'undefined') return []

  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('clear') === 'toolbar') {
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Silently fail and return empty pipelines - localStorage may be unavailable or corrupted
    // The user can always re-create pipelines via the UI
  }
  return []
}

/**
 * Hook to manage custom formatter pipelines with localStorage persistence.
 * @returns Pipelines state and management functions
 */
export function useFormatters(): UseFormattersReturn {
  const [pipelines, setPipelines] = useState<TransformationPipeline[]>(getInitialPipelines)
  const [loaded] = useState(true)

  const addPipeline = useCallback((pipeline: TransformationPipeline) => {
    setPipelines((prev) => {
      const next = [...prev, pipeline]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const updatePipeline = useCallback((pipeline: TransformationPipeline) => {
    setPipelines((prev) => {
      const next = prev.map((p) => (p.id === pipeline.id ? pipeline : p))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removePipeline = useCallback((id: string) => {
    setPipelines((prev) => {
      const next = prev.filter((p) => p.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const replacePipelines = useCallback((newPipelines: TransformationPipeline[]) => {
    setPipelines(newPipelines)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPipelines))
  }, [])

  return {
    pipelines,
    addPipeline,
    updatePipeline,
    removePipeline,
    replacePipelines,
    loaded,
  }
}
