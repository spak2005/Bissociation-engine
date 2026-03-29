import { parseCompoundRecord } from './parsePubChem'

const BASE = '/pubchem-api'

/**
 * Resolve a drug name to a PubChem Compound ID (CID).
 * Uses the PUG REST name-to-CID endpoint.
 * Returns the first CID found or throws on failure.
 */
export async function fetchDrugCid(drugName) {
  const encoded = encodeURIComponent(drugName.trim())
  const url = `${BASE}/rest/pug/compound/name/${encoded}/cids/JSON`

  const res = await fetch(url)

  if (res.status === 404) {
    throw new Error(`Drug "${drugName}" not found in PubChem.`)
  }

  if (!res.ok) {
    throw new Error(`PubChem CID lookup failed (HTTP ${res.status}).`)
  }

  const data = await res.json()
  const cids = data?.IdentifierList?.CID

  if (!cids || cids.length === 0) {
    throw new Error(`No CID returned for "${drugName}".`)
  }

  return cids[0]
}

/**
 * Fetch the full PUG View compound data for a given CID.
 * Returns the raw JSON (Record object) from PubChem.
 */
export async function fetchCompoundView(cid) {
  const url = `${BASE}/rest/pug_view/data/compound/${cid}/JSON`

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`PubChem compound view failed (HTTP ${res.status}).`)
  }

  const data = await res.json()
  const record = data?.Record

  if (!record) {
    throw new Error(`No compound record returned for CID ${cid}.`)
  }

  return record
}

/**
 * Full pipeline: drug name → CID → PUG View → parsed summary.
 * Returns { cid, name, sections[] } ready for LLM consumption.
 */
export async function fetchDrugData(drugName) {
  const cid = await fetchDrugCid(drugName)
  console.log('[pubchem] fetched CID:', cid, `for "${drugName.trim()}"`)
  const record = await fetchCompoundView(cid)
  const summary = parseCompoundRecord(record)
  console.log('[pubchem] sections count:', summary.sections.length)
  return summary
}
