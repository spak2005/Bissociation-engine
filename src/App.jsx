import { useState, useCallback } from 'react'
import { fetchDrugData } from './api/pubchem'
import { decompose } from './api/llm'
import SplitView from './components/SplitView'
import MergedView from './components/MergedView'

function App() {
  const [drug, setDrug] = useState('')
  const [disease, setDisease] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)

  const [screen, setScreen] = useState('input')
  const [fading, setFading] = useState(false)
  const [drugNodes, setDrugNodes] = useState([])
  const [diseaseNodes, setDiseaseNodes] = useState([])
  const [resolvedDrugName, setResolvedDrugName] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!drug.trim() || !disease.trim()) return

    setLoading(true)
    setError(null)
    setStatus('Fetching drug data from PubChem…')

    try {
      const pubchemData = await fetchDrugData(drug)
      setResolvedDrugName(pubchemData.name)

      setStatus('Decomposing with AI… This may take a few seconds.')

      const { drugNodes: dNodes, diseaseNodes: eNodes } = await decompose(
        pubchemData,
        disease.trim()
      )

      setDrugNodes(dNodes)
      setDiseaseNodes(eNodes)
      setScreen('split')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setStatus('')
    }
  }

  const handleBisociate = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      setScreen('merged')
      setFading(false)
    }, 400)
  }, [])

  if (screen === 'merged') {
    return (
      <div className={`transition-opacity duration-400 ${fading ? 'opacity-0' : 'opacity-100'}`}>
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
      <div className={`transition-opacity duration-400 ${fading ? 'opacity-0' : 'opacity-100'}`}>
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
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-light tracking-tight text-zinc-100 sm:text-5xl">
            Bisociation Engine
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            Discover novel drug-repurposing hypotheses through AI-driven
            cross-domain linking.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              value={drug}
              onChange={(e) => setDrug(e.target.value)}
              placeholder="Drug name (e.g. Metformin)"
              disabled={loading}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
            />
          </div>

          <div>
            <input
              type="text"
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              placeholder="Disease name (e.g. Alzheimer's disease)"
              disabled={loading}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-fuchsia-500/60 focus:ring-1 focus:ring-fuchsia-500/30 disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}

          {status && (
            <p className="text-center text-sm text-zinc-400 animate-pulse">
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !drug.trim() || !disease.trim()}
            className="w-full rounded-lg bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              boxShadow: loading
                ? 'none'
                : '0 0 20px rgba(255,255,255,0.08)',
            }}
          >
            {loading ? 'Analyzing…' : 'Decompose & Explore'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
