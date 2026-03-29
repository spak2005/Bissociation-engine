import { useMemo, useState, useEffect, useCallback } from 'react'
import BioGraph from './BioGraph'
import { buildGraphData } from '../utils/buildGraphData'

/**
 * Split-view screen: drug graph on the left, disease graph on the right,
 * with a pulsing "Begin Bisociation" button centered between them.
 * Clicking a graph panel expands it full-screen; click again or Esc to collapse.
 */
export default function SplitView({
  drugNodes,
  diseaseNodes,
  drugName,
  diseaseName,
  onBisociate,
}) {
  const drugGraphData = useMemo(() => buildGraphData(drugNodes), [drugNodes])
  const diseaseGraphData = useMemo(() => buildGraphData(diseaseNodes), [diseaseNodes])

  // null | 'drug' | 'disease'
  const [expanded, setExpanded] = useState(null)

  const toggleExpand = useCallback(
    (panel) => setExpanded((prev) => (prev === panel ? null : panel)),
    []
  )

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setExpanded(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const drugPanel = (
    <div
      onClick={() => toggleExpand('drug')}
      className={`relative h-full cursor-pointer transition-all duration-300 ease-in-out ${
        expanded === 'disease'
          ? 'w-0 overflow-hidden opacity-0'
          : expanded === 'drug'
            ? 'w-full'
            : 'w-1/2 border-r border-white/[0.06]'
      }`}
    >
      <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="rounded-lg border border-cyan-500/20 bg-cyan-950/40 px-3 py-1.5 text-xs font-light text-cyan-200 backdrop-blur-md">
          {drugName}
        </span>
        {expanded === 'drug' && (
          <span className="rounded-lg border border-white/10 bg-zinc-950/50 px-2.5 py-1 text-xs font-light text-zinc-500 backdrop-blur-md">
            ESC to exit
          </span>
        )}
      </div>
      <BioGraph graphData={drugGraphData} accentHue="cyan" />
    </div>
  )

  const diseasePanel = (
    <div
      onClick={() => toggleExpand('disease')}
      className={`relative h-full cursor-pointer transition-all duration-300 ease-in-out ${
        expanded === 'drug'
          ? 'w-0 overflow-hidden opacity-0'
          : expanded === 'disease'
            ? 'w-full'
            : 'w-1/2'
      }`}
    >
      <div className="pointer-events-none absolute top-4 right-4 z-10 flex items-center gap-2">
        {expanded === 'disease' && (
          <span className="rounded-lg border border-white/10 bg-zinc-950/50 px-2.5 py-1 text-xs font-light text-zinc-500 backdrop-blur-md">
            ESC to exit
          </span>
        )}
        <span className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-950/40 px-3 py-1.5 text-xs font-light text-fuchsia-200 backdrop-blur-md">
          {diseaseName}
        </span>
      </div>
      <BioGraph graphData={diseaseGraphData} accentHue="magenta" />
    </div>
  )

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#06060f]">
      {drugPanel}

      {!expanded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onBisociate()
            }}
            className="pointer-events-auto bisociate-btn rounded-full border border-white/15 bg-zinc-950/55 px-8 py-3.5 text-base font-light text-zinc-100 backdrop-blur-xl transition-all duration-300 ease-in-out hover:border-cyan-400/30 hover:bg-zinc-900/60 hover:shadow-[0_0_40px_rgba(6,182,212,0.12)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Begin Bisociation
          </button>
        </div>
      )}

      {diseasePanel}
    </div>
  )
}
