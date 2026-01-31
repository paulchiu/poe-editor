import { useState, useEffect, useCallback } from 'react'
import type { TransformationPipeline } from '@/components/formatter/types'

const STORAGE_KEY = 'poe-editor-pipelines'

export function useFormatters() {
  const [pipelines, setPipelines] = useState<TransformationPipeline[]>([])
  const [loaded, setLoaded] = useState(false)

  // Load from storage
  useEffect(() => {
    try {
      // DEBUG: Allow clearing storage via URL param
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('clear') === 'toolbar') {
          localStorage.removeItem(STORAGE_KEY)
          console.log('Cleared formatter storage')
          setLoaded(true)
          return
        }
      }

      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setPipelines(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load formatters', e)
    }
    setLoaded(true)
  }, [])

  // Persist to storage whenever pipelines change
  // Note: This needs to be careful about not overwriting with empty array on initial load if we had logic there
  // But we only set loaded=true after reading.
  // Actually, standard pattern is to only write when we explicitly change via methods, or use useEffect with dependency.
  // But if multiple instances of hook exist, they might drift. 
  // For now, on a single page app without Context, this hook should ideally be used once in a parent.
  
  const saveToStorage = (newPipelines: TransformationPipeline[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPipelines))
      setPipelines(newPipelines)
    } catch (e) {
      console.error('Failed to save formatters', e)
    }
  }

  const addPipeline = useCallback((pipeline: TransformationPipeline) => {
    setPipelines(prev => {
      const next = [...prev, pipeline]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const updatePipeline = useCallback((pipeline: TransformationPipeline) => {
    setPipelines(prev => {
      const next = prev.map(p => p.id === pipeline.id ? pipeline : p)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removePipeline = useCallback((id: string) => {
    setPipelines(prev => {
      const next = prev.filter(p => p.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return {
    pipelines,
    addPipeline,
    updatePipeline,
    removePipeline,
    loaded
  }
}
