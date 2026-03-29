const OPENAI_URL = '/openai-api/v1/chat/completions'

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

  try {
    const parsed = JSON.parse(content)

    if (!Array.isArray(parsed.drugNodes) || !Array.isArray(parsed.diseaseNodes)) {
      throw new Error('Missing drugNodes or diseaseNodes arrays.')
    }

    return parsed
  } catch (e) {
    throw new Error(`Failed to parse LLM JSON: ${e.message}\n\nRaw: ${content.slice(0, 500)}`)
  }
}
