/**
 * Lightweight performance tracer for measuring CPU time between steps.
 * Designed for diagnosing Cloudflare Worker CPU time limits.
 */

interface PerfMark {
  label: string
  time: number
}

interface PerfTracer {
  mark: (label: string) => void
  summary: () => string
}

/**
 * Creates a performance tracer that records checkpoints and produces a timing summary.
 * @param name - A prefix label for the summary output
 * @returns A tracer with `mark` and `summary` methods
 */
export function createPerfTracer(name: string): PerfTracer {
  const marks: PerfMark[] = [{ label: '__start', time: performance.now() }]

  return {
    /**
     * Records a named checkpoint at the current time.
     * @param label - Descriptive label for this checkpoint
     */
    mark(label: string): void {
      marks.push({ label, time: performance.now() })
    },

    /**
     * Returns a formatted summary string of all step durations and total time.
     * @returns Formatted timing summary
     */
    summary(): string {
      const steps: string[] = []
      for (let i = 1; i < marks.length; i++) {
        const duration = marks[i].time - marks[i - 1].time
        steps.push(`${marks[i].label}: ${duration.toFixed(1)}ms`)
      }
      const total = marks[marks.length - 1].time - marks[0].time
      steps.push(`total: ${total.toFixed(1)}ms`)
      return `[perf:${name}] ${steps.join(' | ')}`
    },
  }
}
