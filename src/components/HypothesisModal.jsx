import { useEffect } from 'react'

function confidenceColor(score) {
  if (score >= 7) return { text: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-800/40' }
  if (score >= 4) return { text: 'text-yellow-400', bg: 'bg-yellow-950/60', border: 'border-yellow-800/40' }
  return { text: 'text-red-400', bg: 'bg-red-950/60', border: 'border-red-800/40' }
}

function confidenceLabel(score) {
  if (score >= 7) return 'Strong'
  if (score >= 4) return 'Speculative'
  return 'Weak'
}

/**
 * Modal card showing a hypothesis for a single cross-link.
 */
export default function HypothesisModal({ data, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!data) return null

  const c = confidenceColor(data.confidence)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md transition-opacity duration-300 ease-in-out"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-lg rounded-2xl p-8 shadow-2xl transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h3 className="text-2xl font-light tracking-tight text-zinc-100">
            Hypothesis
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-transparent px-2 py-1 text-zinc-500 transition-all duration-300 ease-in-out hover:border-white/10 hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-cyan-500/25 bg-cyan-950/35 px-3 py-1.5 text-xs font-light text-cyan-200 backdrop-blur-sm">
            {data.drugLabel}
          </span>
          <span className="text-base font-light text-zinc-600">↔</span>
          <span className="rounded-lg border border-fuchsia-500/25 bg-fuchsia-950/35 px-3 py-1.5 text-xs font-light text-fuchsia-200 backdrop-blur-sm">
            {data.diseaseLabel}
          </span>
        </div>

        <p className="mb-6 text-base font-light leading-relaxed text-zinc-300">
          {data.hypothesis}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-lg border px-3 py-1.5 text-xs font-light ${c.text} ${c.bg} ${c.border}`}
          >
            {confidenceLabel(data.confidence)}
          </span>
          <span className="text-xs font-light text-zinc-500">
            Confidence: {data.confidence}/10
          </span>
        </div>
      </div>
    </div>
  )
}
