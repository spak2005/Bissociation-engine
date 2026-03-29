const OPENAI_URL = '/openai-api/v1/chat/completions'
const BATCH_SIZE = 8

const SYSTEM_PROMPT = `You are a biomedical knowledge decomposition engine. Given raw PubChem drug data and a disease name, you must decompose BOTH into structured graph nodes.

For the DRUG, extract 6-10 nodes covering:
- Mechanisms of action (how the drug works at a molecular level)
- Protein targets (specific proteins/receptors the drug binds to)
- Pathways (signaling or metabolic pathways involved)
- Pharmacological actions (therapeutic effects and drug class)

For the DISEASE, generate 6-10 nodes covering:
- Involved genes (real gene names like APP, PSEN1, MAPT, etc.)
- Molecular mechanisms (e.g. protein aggregation, neuroinflammation)
- Pathways (real signaling pathways involved in pathology)
- Key symptoms or phenotypes at the molecular/cellular level

CRITICAL RULES:
- Use REAL gene names, protein names, and pathway names. Do not invent fake biology.
- Every node must reference actual biomedical knowledge.
- Node IDs: use "d1", "d2", ... for drug nodes and "e1", "e2", ... for disease nodes.
- Categories must be one of: "mechanism", "target", "pathway", "action", "gene", "symptom"

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "drugNodes": [
    { "id": "d1", "label": "...", "category": "mechanism|target|pathway|action", "description": "One sentence description" }
  ],
  "diseaseNodes": [
    { "id": "e1", "label": "...", "category": "gene|mechanism|pathway|symptom", "description": "One sentence description" }
  ]
}`

/**
 * Call OpenAI to decompose drug data + disease into structured graph nodes.
 *
 * @param {{ cid: number, name: string, sections: Array<{heading: string, text: string}> }} drugData
 * @param {string} diseaseName
 * @returns {Promise<{ drugNodes: Array, diseaseNodes: Array }>}
 */
export async function decompose(drugData, diseaseName) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'Missing VITE_OPENAI_API_KEY. Add it to your .env file.'
    )
  }

  const sectionsText = drugData.sections
    .map((s) => `### ${s.heading}\n${s.text}`)
    .join('\n\n')

  const userMessage = `DRUG: ${drugData.name} (PubChem CID ${drugData.cid})

--- RAW PUBCHEM DATA ---
${sectionsText}
--- END DATA ---

DISEASE: ${diseaseName}

Decompose both into graph nodes as specified.`

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenAI API error (HTTP ${res.status}): ${body}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Empty response from OpenAI.')
  }

  console.log('[llm] decompose raw response:', content)

  try {
    const parsed = JSON.parse(content)

    if (!Array.isArray(parsed.drugNodes) || !Array.isArray(parsed.diseaseNodes)) {
      throw new Error('Missing drugNodes or diseaseNodes arrays.')
    }

    console.log(
      '[llm] decompose parsed node counts:',
      'drugNodes=',
      parsed.drugNodes.length,
      'diseaseNodes=',
      parsed.diseaseNodes.length
    )

    return parsed
  } catch (e) {
    throw new Error(`Failed to parse LLM JSON: ${e.message}\n\nRaw: ${content.slice(0, 500)}`)
  }
}

const HYPOTHESIS_SYSTEM_PROMPT = `You are a drug repurposing hypothesis generator. Given pairs of drug properties and disease properties, generate a novel repurposing hypothesis for each pair. Be scientifically grounded. Return ONLY valid JSON (no markdown fences).`

function stripCodeFences(str) {
  return str.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

function normalizeHypothesisResultsArray(parsed) {
  if (Array.isArray(parsed)) return parsed
  if (parsed && Array.isArray(parsed.hypotheses)) return parsed.hypotheses
  if (parsed && typeof parsed === 'object' && parsed.hypothesis != null) return [parsed]
  return []
}

/** 0-based batch slot from LLM pairIndex, or null. Accepts 0-based or 1-based indices. */
function pairIndexToSlot(pairIndex, batchLength) {
  if (pairIndex == null || pairIndex === '') return null
  const n = Math.trunc(Number(pairIndex))
  if (!Number.isFinite(n)) return null
  if (n >= 0 && n < batchLength) return n
  if (n >= 1 && n <= batchLength) return n - 1
  return null
}

/**
 * Map LLM items to batch slots without collapsing duplicate pairIndex onto one link.
 * Fills unclaimed slots in array order so N outputs yield N distinct linkIds when possible.
 */
function mapHypothesisBatch(batch, hypothesisItems) {
  const len = batch.length
  const slots = Array.from({ length: len }, () => null)
  const used = new Set()

  for (const r of hypothesisItems) {
    const slot = pairIndexToSlot(r.pairIndex ?? r.pair_index, len)
    if (slot == null) continue
    if (slots[slot] != null) continue
    slots[slot] = r
    used.add(r)
  }

  for (let i = 0; i < len; i++) {
    if (slots[i] != null) continue
    const next = hypothesisItems.find((item) => !used.has(item))
    if (!next) break
    slots[i] = next
    used.add(next)
  }

  const mapped = []
  for (let i = 0; i < len; i++) {
    const r = slots[i]
    const pair = batch[i]
    if (!r || pair == null) continue
    if (r.hypothesis == null || String(r.hypothesis).trim() === '') continue

    mapped.push({
      linkId: pair.linkId,
      drugLabel: pair.drugLabel,
      diseaseLabel: pair.diseaseLabel,
      hypothesis: r.hypothesis,
      confidence: Math.max(
        1,
        Math.min(10, Math.round(Number(r.confidence) || 5))
      ),
    })
  }
  return mapped
}

/**
 * Fire batched LLM calls for hypothesis generation.
 * Calls onBatchResult(results[]) as each batch resolves,
 * enabling real-time UI updates.
 *
 * @param {Array<{linkId, drugLabel, drugDescription, diseaseLabel, diseaseDescription}>} pairs
 * @param {(results: Array) => void} onBatchResult
 */
export async function generateHypothesesBatched(pairs, onBatchResult) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing VITE_OPENAI_API_KEY.')

  const batches = []
  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    batches.push(pairs.slice(i, i + BATCH_SIZE))
  }

  const promises = batches.map(async (batch, batchIndex) => {
    console.log(
      `[llm] hypothesis batch ${batchIndex + 1}/${batches.length} pairs:`,
      batch
    )

    const pairsText = batch
      .map(
        (p, i) =>
          `Pair ${i + 1}:\n  Drug property: ${p.drugLabel} — ${p.drugDescription}\n  Disease property: ${p.diseaseLabel} — ${p.diseaseDescription}`
      )
      .join('\n\n')

    const userMessage = `Generate a drug repurposing hypothesis for each of these ${batch.length} pairs.\n\n${pairsText}\n\nReturn ONLY a JSON array of exactly ${batch.length} objects, in the SAME ORDER as the pairs above (first object = Pair 1, second = Pair 2, etc.).\nEach object must include:\n- pairIndex: integer 0 for Pair 1, 1 for Pair 2, through ${batch.length - 1} for the last pair (each value unique).\n- hypothesis: one paragraph explaining the repurposing connection.\n- confidence: integer 1-10 (10 = highly plausible based on known biology).\n\nExample shape:\n[{ "pairIndex": 0, "hypothesis": "...", "confidence": 5 }, ...]`

    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        messages: [
          { role: 'system', content: HYPOTHESIS_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`OpenAI error (${res.status}): ${body}`)
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content
    if (!raw) throw new Error('Empty hypothesis response.')

    console.log(`[llm] hypothesis batch ${batchIndex} raw response:`, raw)

    let parsed
    try {
      parsed = JSON.parse(stripCodeFences(raw))
    } catch (parseErr) {
      console.log(`[llm] hypothesis batch ${batchIndex} JSON parse failed:`, parseErr)
      throw parseErr
    }

    const results = normalizeHypothesisResultsArray(parsed)
    if (results.length === 0 && batch.length > 0) {
      console.log(
        `[llm] hypothesis batch ${batchIndex} no hypothesis items after normalize:`,
        parsed
      )
    }

    console.log(`[llm] hypothesis batch ${batchIndex} parsed JSON:`, results)

    const mapped = mapHypothesisBatch(batch, results)
    if (mapped.length !== batch.length) {
      console.log(
        `[llm] hypothesis batch ${batchIndex} mapped count ${mapped.length} !== batch size ${batch.length}`
      )
    }

    console.log(`[llm] hypothesis batch ${batchIndex} mapped results:`, mapped)

    onBatchResult(mapped)
    return mapped
  })

  const outcomes = await Promise.allSettled(promises)
  outcomes.forEach((outcome, i) => {
    if (outcome.status === 'rejected') {
      console.log('[llm] hypothesis batch settled rejection', {
        batchIndex: i,
        reason: outcome.reason,
      })
    }
  })
}
