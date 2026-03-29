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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#111118] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-sm font-medium text-zinc-300">Hypothesis</h3>
          <button
            onClick={onClose}
            className="text-zinc-600 transition hover:text-zinc-300"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-3">
          <span className="rounded-md bg-cyan-950/60 px-2.5 py-1 text-xs font-medium text-cyan-300">
            {data.drugLabel}
          </span>
          <span className="text-zinc-600">↔</span>
          <span className="rounded-md bg-fuchsia-950/60 px-2.5 py-1 text-xs font-medium text-fuchsia-300">
            {data.diseaseLabel}
          </span>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-zinc-400">
          {data.hypothesis}
        </p>

        <div className="flex items-center gap-3">
          <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${c.text} ${c.bg} ${c.border}`}>
            {confidenceLabel(data.confidence)}
          </span>
          <span className="text-xs text-zinc-600">
            Confidence: {data.confidence}/10
          </span>
        </div>
      </div>
    </div>
  )
}
