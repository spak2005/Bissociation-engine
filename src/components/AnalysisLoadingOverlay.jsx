import { useEffect, useState } from 'react'

const STATUS_LINES = [
  'Fetching molecular data from PubChem...',
  'Analyzing disease pathways...',
  'Decomposing into graph nodes...',
  'Preparing visualization...',
]

/**
 * Full-screen analysis state: helix + concentric rings + sequential status copy.
 * Remount with a new `key` from the parent each run so initial state resets without effect setState.
 */
export default function AnalysisLoadingOverlay() {
  const [visibleCount, setVisibleCount] = useState(1)

  useEffect(() => {
    const stepMs = 950
    const t2 = setTimeout(() => setVisibleCount(2), stepMs)
    const t3 = setTimeout(() => setVisibleCount(3), stepMs * 2)
    const t4 = setTimeout(() => setVisibleCount(4), stepMs * 3)
    return () => {
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#06060f]/95 backdrop-blur-md transition-opacity duration-300 ease-in-out"
      role="status"
      aria-live="polite"
      aria-label="Analyzing molecular data"
    >
      <div className="relative mb-14 flex h-52 w-52 items-center justify-center sm:h-60 sm:w-60">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="loader-ring absolute rounded-full border border-cyan-400/25"
              style={{
                width: `${38 + i * 22}%`,
                height: `${38 + i * 22}%`,
                animationDelay: `${i * 0.75}s`,
                borderColor:
                  i % 2 === 0
                    ? 'rgba(6, 182, 212, 0.22)'
                    : 'rgba(217, 70, 239, 0.18)',
              }}
            />
          ))}
        </div>
        <svg
          className="relative z-[1] h-36 w-36 sm:h-44 sm:w-44"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <linearGradient id="helixA" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="helixB" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d946ef" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#e879f0" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <g className="animate-helix-drift">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
              const t = (i / 12) * Math.PI * 2
              const y = 60 + (i / 11) * 56 - 28
              const x1 = 60 + Math.sin(t) * 14
              const x2 = 60 + Math.sin(t + Math.PI) * 14
              return (
                <g key={i}>
                  <circle
                    cx={x1}
                    cy={y}
                    r={i % 3 === 0 ? 2.2 : 1.4}
                    fill="url(#helixA)"
                    className="animate-node-pulse"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                  <circle
                    cx={x2}
                    cy={y}
                    r={i % 3 === 0 ? 2.2 : 1.4}
                    fill="url(#helixB)"
                    className="animate-node-pulse"
                    style={{ animationDelay: `${i * 0.12 + 0.4}s` }}
                  />
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      <div className="mx-auto flex min-h-[8.5rem] w-full max-w-md flex-col items-center gap-3 px-6">
        {STATUS_LINES.map((line, i) => (
          <p
            key={line}
            className={`text-center text-base font-light tracking-wide text-zinc-200 transition-all duration-300 ease-in-out ${
              i < visibleCount
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-1 opacity-0'
            }`}
            style={{ transitionDelay: i < visibleCount ? `${i * 40}ms` : '0ms' }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
