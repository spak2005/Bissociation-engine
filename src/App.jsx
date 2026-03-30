import { useState, useCallback, useEffect } from 'react'
import { fetchDrugData } from './api/pubchem'
import { fetchGeneDiseaseAssociations } from './api/disgenet'
import { decompose } from './api/llm'
import SplitView from './components/SplitView'
import MergedView from './components/MergedView'
import AmbientMeshBackground from './components/AmbientMeshBackground'
import AnalysisLoadingOverlay from './components/AnalysisLoadingOverlay'

const DISGENET_STORAGE_KEY = 'bissociation_disgenet_api_key'

function App() {
  const [drug, setDrug] = useState('')
  const [disease, setDisease] = useState('')
  const [diseaseSourceMode, setDiseaseSourceMode] = useState('llm_only')
  const [disgenetApiKey, setDisgenetApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [screen, setScreen] = useState('input')
  const [fading, setFading] = useState(false)
  const [drugNodes, setDrugNodes] = useState([])
  const [diseaseNodes, setDiseaseNodes] = useState([])
  const [resolvedDrugName, setResolvedDrugName] = useState('')
  const [analysisKey, setAnalysisKey] = useState(0)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISGENET_STORAGE_KEY)
      if (stored != null) setDisgenetApiKey(stored)
    } catch {
      /* ignore */
    }
  }, [])

  const handleDisgenetKeyChange = (e) => {
    const v = e.target.value
    setDisgenetApiKey(v)
    try {
      localStorage.setItem(DISGENET_STORAGE_KEY, v)
    } catch {
      /* ignore */
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!drug.trim() || !disease.trim()) return

    if (diseaseSourceMode === 'disgenet_llm' && !disgenetApiKey.trim()) {
      setError('DisGeNET API key is required for DisGeNET + LLM mode.')
      return
    }

    setAnalysisKey((k) => k + 1)
    setLoading(true)
    setError(null)

    try {
      const pubchemData = await fetchDrugData(drug)
      setResolvedDrugName(pubchemData.name)

      let disgenetSummary = null
      if (diseaseSourceMode === 'disgenet_llm') {
        const gda = await fetchGeneDiseaseAssociations(
          disease,
          disgenetApiKey.trim()
        )
        disgenetSummary = gda.summaryText
      }

      const { drugNodes: dNodes, diseaseNodes: eNodes } = await decompose(
        pubchemData,
        disease.trim(),
        disgenetSummary
      )

      setDrugNodes(dNodes)
      setDiseaseNodes(eNodes)
      setScreen('split')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBisociate = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      setScreen('merged')
      setFading(false)
    }, 300)
  }, [])

  if (screen === 'merged') {
    return (
      <div
        className={`transition-opacity duration-300 ease-in-out ${fading ? 'opacity-0' : 'opacity-100'}`}
      >
        <MergedView
          drugNodes={drugNodes}
          diseaseNodes={diseaseNodes}
          drugName={resolvedDrugName}
          diseaseName={disease.trim()}
        />
      </div>
    )
  }

  if (screen === 'split') {
    return (
      <div
        className={`transition-opacity duration-300 ease-in-out ${fading ? 'opacity-0' : 'opacity-100'}`}
      >
        <SplitView
          drugNodes={drugNodes}
          diseaseNodes={diseaseNodes}
          drugName={resolvedDrugName}
          diseaseName={disease.trim()}
          onBisociate={handleBisociate}
        />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-svh flex-1 flex-col items-center justify-center overflow-hidden bg-[#06060f] px-4 py-16">
      <AmbientMeshBackground />
      {loading && <AnalysisLoadingOverlay key={analysisKey} />}

      <div
        className={`relative z-10 w-full max-w-lg transition-all duration-300 ease-in-out ${
          loading ? 'pointer-events-none scale-[0.98] opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="mb-10 text-center">
          <h1 className="bg-gradient-to-r from-cyan-400 via-zinc-100 to-fuchsia-400 bg-clip-text text-5xl font-light tracking-tight text-transparent sm:text-6xl md:text-7xl">
            Bisociation Engine
          </h1>
          <p className="tagline-reveal mx-auto mt-5 max-w-md text-base font-light leading-relaxed text-zinc-400">
            Discover novel drug-repurposing hypotheses through AI-driven
            cross-domain linking.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="landing-drug"
                className="mb-2 block text-xs font-medium uppercase tracking-widest text-cyan-400/90"
              >
                Drug
              </label>
              <input
                id="landing-drug"
                type="text"
                value={drug}
                onChange={(e) => setDrug(e.target.value)}
                placeholder="Drug name (e.g. Metformin)"
                disabled={loading}
                className="input-glow-cyan w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-base font-light text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-300 ease-in-out focus:border-cyan-400/50 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="landing-disease"
                className="mb-2 block text-xs font-medium uppercase tracking-widest text-fuchsia-400/90"
              >
                Disease
              </label>
              <input
                id="landing-disease"
                type="text"
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
                placeholder="Disease name (e.g. Alzheimer's disease)"
                disabled={loading}
                className="input-glow-fuchsia w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-base font-light text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-300 ease-in-out focus:border-fuchsia-400/50 disabled:opacity-50"
              />
            </div>

            <fieldset className="space-y-3 border-0 p-0">
              <legend className="mb-2 block text-xs font-medium uppercase tracking-widest text-zinc-500">
                Disease decomposition
              </legend>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-light text-zinc-300">
                  <input
                    type="radio"
                    name="disease-source"
                    value="llm_only"
                    checked={diseaseSourceMode === 'llm_only'}
                    onChange={() => setDiseaseSourceMode('llm_only')}
                    disabled={loading}
                    className="h-4 w-4 shrink-0 border-white/20 bg-white/[0.06] text-fuchsia-500 focus:ring-fuchsia-400/40"
                  />
                  LLM Only
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-light text-zinc-300">
                  <input
                    type="radio"
                    name="disease-source"
                    value="disgenet_llm"
                    checked={diseaseSourceMode === 'disgenet_llm'}
                    onChange={() => setDiseaseSourceMode('disgenet_llm')}
                    disabled={loading}
                    className="h-4 w-4 shrink-0 border-white/20 bg-white/[0.06] text-fuchsia-500 focus:ring-fuchsia-400/40"
                  />
                  DisGeNET + LLM
                </label>
              </div>
            </fieldset>

            {diseaseSourceMode === 'disgenet_llm' && (
              <div>
                <label
                  htmlFor="landing-disgenet-key"
                  className="mb-2 block text-xs font-medium uppercase tracking-widest text-zinc-400/90"
                >
                  DisGeNET API key
                </label>
                <input
                  id="landing-disgenet-key"
                  type="password"
                  value={disgenetApiKey}
                  onChange={handleDisgenetKeyChange}
                  placeholder="Bearer token from DisGeNET"
                  disabled={loading}
                  autoComplete="off"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-base font-light text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-300 ease-in-out focus:border-zinc-400/40 focus:shadow-[0_0_24px_rgba(161,161,170,0.08)] disabled:opacity-50"
                />
              </div>
            )}

            {error && (
              <p className="text-center text-base font-light text-red-400/95 transition-opacity duration-300 ease-in-out">
                {error}
              </p>
            )}

            <div className="btn-gradient-border rounded-xl p-px">
              <button
                type="submit"
                disabled={
                  loading ||
                  !drug.trim() ||
                  !disease.trim() ||
                  (diseaseSourceMode === 'disgenet_llm' &&
                    !disgenetApiKey.trim())
                }
                className="w-full rounded-[11px] border border-white/5 bg-[#06060f]/85 px-5 py-4 text-base font-light text-zinc-100 backdrop-blur-sm transition-all duration-300 ease-in-out hover:border-white/10 hover:bg-[#06060f]/95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/5"
              >
                Decompose & Explore
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
