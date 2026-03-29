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
