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
      className={`relative h-full cursor-pointer transition-all duration-500 ease-in-out ${
        expanded === 'disease'
          ? 'w-0 overflow-hidden opacity-0'
          : expanded === 'drug'
            ? 'w-full'
            : 'w-1/2 border-r border-zinc-800/30'
      }`}
    >
      <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="rounded-md bg-cyan-950/60 px-2.5 py-1 text-xs font-medium text-cyan-300 backdrop-blur-sm">
          {drugName}
        </span>
        {expanded === 'drug' && (
          <span className="rounded-md bg-zinc-800/60 px-2 py-1 text-[10px] text-zinc-500 backdrop-blur-sm">
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
      className={`relative h-full cursor-pointer transition-all duration-500 ease-in-out ${
        expanded === 'drug'
          ? 'w-0 overflow-hidden opacity-0'
          : expanded === 'disease'
            ? 'w-full'
            : 'w-1/2'
      }`}
    >
      <div className="pointer-events-none absolute top-4 right-4 z-10 flex items-center gap-2">
        {expanded === 'disease' && (
          <span className="rounded-md bg-zinc-800/60 px-2 py-1 text-[10px] text-zinc-500 backdrop-blur-sm">
            ESC to exit
          </span>
        )}
        <span className="rounded-md bg-fuchsia-950/60 px-2.5 py-1 text-xs font-medium text-fuchsia-300 backdrop-blur-sm">
          {diseaseName}
        </span>
      </div>
      <BioGraph graphData={diseaseGraphData} accentHue="magenta" />
    </div>
  )

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      {drugPanel}

      {!expanded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onBisociate()
            }}
            className="pointer-events-auto bisociate-btn rounded-full border border-white/10 bg-zinc-900/80 px-6 py-3 text-sm font-medium text-zinc-100 backdrop-blur-md transition-all hover:border-white/25 hover:bg-zinc-800/90 hover:scale-105 active:scale-95"
          >
            Begin Bisociation
          </button>
        </div>
      )}

      {diseasePanel}
    </div>
  )
}
