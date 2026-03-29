const BASE = '/disgenet-api/api'

/**
 * Fetch gene-disease associations from DisGeNET for a given disease.
 *
 * Returns the top associations sorted by score, capped at 20 to keep
 * the LLM context manageable. Falls back gracefully if no API key is
 * configured or the request fails.
 *
 * @param {string} diseaseName - Free-text disease name to search for.
 * @returns {Promise<Array<{geneName: string, geneId: number, diseaseName: string, score: number, description: string}> | null>}
 */
export async function fetchDiseaseGenes(diseaseName) {
  const apiKey = import.meta.env.VITE_DISGENET_API_KEY

  if (!apiKey) {
    console.warn('VITE_DISGENET_API_KEY not set — skipping DisGeNET lookup.')
    return null
  }

  const encoded = encodeURIComponent(diseaseName.trim())
  const url = `${BASE}/gda/disease/${encoded}?source=ALL&format=json`

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    })

    if (!res.ok) {
      console.warn(`DisGeNET returned HTTP ${res.status} for "${diseaseName}".`)
      return null
    }

    const data = await res.json()

    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`No DisGeNET associations found for "${diseaseName}".`)
      return null
    }

    const associations = data
      .map((entry) => ({
        geneName: entry.gene_symbol ?? entry.geneName ?? '',
        geneId: entry.geneid ?? entry.geneId ?? 0,
        diseaseName: entry.disease_name ?? entry.diseaseName ?? diseaseName,
        score: entry.score ?? 0,
        description: entry.description ?? '',
      }))
      .filter((a) => a.geneName)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)

    return associations
  } catch (err) {
    console.warn('DisGeNET fetch failed:', err.message)
    return null
  }
}
