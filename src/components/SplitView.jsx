import { useMemo } from 'react'
import BioGraph from './BioGraph'
import { buildGraphData } from '../utils/buildGraphData'

/**
 * Split-view screen: drug graph on the left, disease graph on the right,
 * with a pulsing "Begin Bisociation" button centered between them.
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

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      {/* Drug graph — left half */}
      <div className="relative h-full w-1/2 border-r border-zinc-800/30">
        <div className="pointer-events-none absolute top-4 left-4 z-10">
          <span className="rounded-md bg-cyan-950/60 px-2.5 py-1 text-xs font-medium text-cyan-300 backdrop-blur-sm">
            {drugName}
          </span>
        </div>
        <BioGraph graphData={drugGraphData} accentHue="cyan" />
      </div>

      {/* Center button */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <button
          onClick={onBisociate}
          className="pointer-events-auto bisociate-btn rounded-full border border-white/10 bg-zinc-900/80 px-6 py-3 text-sm font-medium text-zinc-100 backdrop-blur-md transition-all hover:border-white/25 hover:bg-zinc-800/90 hover:scale-105 active:scale-95"
        >
          Begin Bisociation
        </button>
      </div>

      {/* Disease graph — right half */}
      <div className="relative h-full w-1/2">
        <div className="pointer-events-none absolute top-4 right-4 z-10">
          <span className="rounded-md bg-fuchsia-950/60 px-2.5 py-1 text-xs font-medium text-fuchsia-300 backdrop-blur-sm">
            {diseaseName}
          </span>
        </div>
        <BioGraph graphData={diseaseGraphData} accentHue="magenta" />
      </div>
    </div>
  )
}
