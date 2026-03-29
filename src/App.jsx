import { useState } from 'react'
import { fetchDrugData } from './api/pubchem'

function App() {
  const [drug, setDrug] = useState('')
  const [disease, setDisease] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [drugData, setDrugData] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!drug.trim() || !disease.trim()) return

    setLoading(true)
    setError(null)
    setDrugData(null)

    try {
      const data = await fetchDrugData(drug)
      setDrugData(data)
      console.log('PubChem data:', data)
      console.log('Disease (for LLM later):', disease.trim())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div>
            <input
              type="text"
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              placeholder="Disease name (e.g. Alzheimer's disease)"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-fuchsia-500/60 focus:ring-1 focus:ring-fuchsia-500/30"
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
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

        {drugData && (
          <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-left">
            <p className="mb-2 text-xs font-medium text-emerald-400">
              ✓ Fetched data for {drugData.name} (CID {drugData.cid})
            </p>
            <p className="text-xs text-zinc-500">
              {drugData.sections.length} biomedical section
              {drugData.sections.length !== 1 ? 's' : ''} extracted.
              Ready for LLM decomposition.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
