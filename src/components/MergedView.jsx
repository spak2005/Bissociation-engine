import { useState, useCallback, useMemo, useRef } from 'react'
import BioGraph from './BioGraph'
import { MergedContextHeader } from './GraphContextLabels'
import HypothesisModal from './HypothesisModal'
import { buildMergedGraphData } from '../utils/buildGraphData'
import { generateHypothesesBatched } from '../api/llm'

const CONFIDENCE_COLORS = {
  high: 'rgba(34,197,94,0.75)',
  mid: 'rgba(234,179,8,0.65)',
  low: 'rgba(239,68,68,0.55)',
}

function linkConfidenceColor(confidence) {
  if (confidence >= 7) return CONFIDENCE_COLORS.high
  if (confidence >= 4) return CONFIDENCE_COLORS.mid
  return CONFIDENCE_COLORS.low
}

export default function MergedView({ drugNodes, diseaseNodes, drugName, diseaseName }) {
  const [hypotheses, setHypotheses] = useState({})
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [selectedHypothesis, setSelectedHypothesis] = useState(null)

  const hypothesesRef = useRef(hypotheses)

  const { graphData, crossPairs } = useMemo(() => {
    const result = buildMergedGraphData(drugNodes, diseaseNodes)
    return {
      graphData: { nodes: result.nodes, links: result.links },
      crossPairs: result.crossPairs,
    }
  }, [drugNodes, diseaseNodes])

  const handleGenerate = async () => {
    setGenerating(true)
    setProgress({ completed: 0, total: crossPairs.length })

    await generateHypothesesBatched(crossPairs, (batchResults) => {
      setHypotheses((prev) => {
        const next = { ...prev }
        for (const r of batchResults) {
          next[r.linkId] = r
        }
        hypothesesRef.current = next
        return next
      })
      setProgress((prev) => ({
        ...prev,
        completed: prev.completed + batchResults.length,
      }))
    })

    setGenerating(false)
    setDone(true)
  }

  const linkColor = useCallback(
    (link) => {
      if (!link.cross) {
        if (link.intraDomain === 'drug') return 'rgba(34,211,238,0.08)'
        if (link.intraDomain === 'disease') return 'rgba(232,121,240,0.08)'
        return 'rgba(255,255,255,0.04)'
      }
      const h = hypothesesRef.current[link.linkId]
      if (!h) return 'rgba(255,255,255,0.06)'
      return linkConfidenceColor(h.confidence)
    },
    // re-create when hypotheses map changes so ForceGraph re-evaluates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hypotheses]
  )

  const linkWidth = useCallback(
    (link) => {
      if (!link.cross) return 0.3
      const h = hypothesesRef.current[link.linkId]
      return h ? 1.2 : 0.15
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hypotheses]
  )

  const handleLinkClick = useCallback(
    (link) => {
      if (!link.cross) return
      const h = hypothesesRef.current[link.linkId]
      if (h) setSelectedHypothesis(h)
    },
    []
  )

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#06060f]">
      <BioGraph
        graphData={graphData}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkOpacity={0.6}
        onLinkClick={handleLinkClick}
      />

      <MergedContextHeader drugName={drugName} diseaseName={diseaseName} />

      {/* Progress */}
      {generating && (
        <div className="absolute top-4 right-4 z-10">
          <span className="rounded-xl border border-white/10 bg-zinc-950/50 px-4 py-2 text-base font-light text-zinc-300 backdrop-blur-xl transition-opacity duration-300 ease-in-out animate-pulse">
            Generating… {progress.completed}/{progress.total}
          </span>
        </div>
      )}

      {/* Generate button */}
      {!done && !generating && (
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
          <button
            onClick={handleGenerate}
            className="bisociate-btn rounded-full border border-white/15 bg-zinc-950/55 px-8 py-3.5 text-base font-light text-zinc-100 backdrop-blur-xl transition-all duration-300 ease-in-out hover:border-fuchsia-400/25 hover:bg-zinc-900/60 hover:shadow-[0_0_40px_rgba(217,70,239,0.12)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Generate Hypotheses
          </button>
        </div>
      )}

      {/* Summary after completion */}
      {done && !generating && (
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
          <span className="max-w-lg rounded-xl border border-white/10 bg-zinc-950/50 px-5 py-3 text-center text-base font-light leading-relaxed text-zinc-400 backdrop-blur-xl transition-all duration-300 ease-in-out">
            {Object.keys(hypotheses).length} hypotheses generated — click any illuminated link to inspect
          </span>
        </div>
      )}

      {/* Modal */}
      <HypothesisModal
        data={selectedHypothesis}
        onClose={() => setSelectedHypothesis(null)}
      />
    </div>
  )
}
