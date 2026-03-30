const BASE = '/disgenet-api'

const SUMMARY_ROW_CAP = 60

/**
 * Pull a list-like array from heterogeneous DisGeNET JSON payloads.
 */
function extractResultRows(data) {
  if (!data || typeof data !== 'object') return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.gdas)) return data.gdas
  if (Array.isArray(data.associations)) return data.associations
  return []
}

function pickGeneSymbol(row) {
  if (!row || typeof row !== 'object') return null
  const v =
    row.gene_symbol ??
    row.geneSymbol ??
    row.GENE_SYMBOL ??
    row.symbol ??
    row.gene ??
    row.GENE
  if (v == null) return null
  const s = String(v).trim()
  return s || null
}

function pickScore(row) {
  if (!row || typeof row !== 'object') return null
  const keys = [
    'score',
    'Score',
    'DSI',
    'dsi',
    'EI',
    'ei',
    'dis_score',
    'DIS_SCORE',
  ]
  for (const k of keys) {
    if (row[k] != null && row[k] !== '') return row[k]
  }
  return null
}

function pickSource(row) {
  if (!row || typeof row !== 'object') return null
  const v =
    row.source ??
    row.SOURCE ??
    row.source_name ??
    row.disease_source
  if (v == null) return null
  const s = String(v).trim()
  return s || null
}

/**
 * Normalize raw rows for callers and prompt building.
 *
 * @param {object[]} rows
 * @returns {Array<{ geneSymbol: string, score: string | number | null, source: string | null }>}
 */
export function normalizeAssociations(rows) {
  const out = []
  const seen = new Set()
  for (const row of rows) {
    const geneSymbol = pickGeneSymbol(row)
    if (!geneSymbol) continue
    const key = geneSymbol.toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      geneSymbol,
      score: pickScore(row),
      source: pickSource(row),
    })
  }
  return out
}

function buildSummaryText(diseaseName, associations) {
  const lines = [
    `Disease query: ${diseaseName}`,
    `Gene–disease associations (DisGeNET, source=ALL): ${associations.length} unique gene symbols (showing up to ${SUMMARY_ROW_CAP}).`,
    '',
  ]
  const slice = associations.slice(0, SUMMARY_ROW_CAP)
  for (const a of slice) {
    const parts = [a.geneSymbol]
    if (a.score != null) parts.push(`score=${a.score}`)
    if (a.source) parts.push(`source=${a.source}`)
    lines.push(parts.join(' | '))
  }
  if (associations.length > SUMMARY_ROW_CAP) {
    lines.push('')
    lines.push(
      `... ${associations.length - SUMMARY_ROW_CAP} additional genes omitted for length.`
    )
  }
  return lines.join('\n')
}

/**
 * Fetch gene–disease associations from DisGeNET (Bearer token).
 *
 * @param {string} diseaseName
 * @param {string} apiKey
 * @returns {Promise<{ associations: Array, summaryText: string, rawCount: number }>}
 */
export async function fetchGeneDiseaseAssociations(diseaseName, apiKey) {
  const encoded = encodeURIComponent(diseaseName.trim())
  const url = `${BASE}/api/gda/disease/${encoded}?source=ALL&format=json`

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`DisGeNET API error (HTTP ${res.status}): ${body.slice(0, 400)}`)
  }

  const data = await res.json()
  const rows = extractResultRows(data)
  const associations = normalizeAssociations(rows)
  const summaryText = buildSummaryText(diseaseName.trim(), associations)

  return {
    associations,
    summaryText,
    rawCount: rows.length,
  }
}
