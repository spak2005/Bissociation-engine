/**
 * Build intra-category chain links + cross-category bridge links
 * for a single domain's node array.
 */
function buildIntraLinks(nodes, domain) {
  const links = []
  const byCategory = {}

  for (const node of nodes) {
    const cat = node.category
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(node)
  }

  for (const group of Object.values(byCategory)) {
    for (let i = 0; i < group.length - 1; i++) {
      links.push({ source: group[i].id, target: group[i + 1].id, intraDomain: domain })
    }
  }

  const heads = Object.values(byCategory).map((g) => g[0])
  for (let i = 0; i < heads.length - 1; i++) {
    links.push({ source: heads[i].id, target: heads[i + 1].id, intraDomain: domain })
  }

  return links
}

/**
 * Convert a single domain's nodes into a force-graph data object.
 */
export function buildGraphData(nodes) {
  const graphNodes = nodes.map((n) => ({ ...n }))
  const links = buildIntraLinks(graphNodes, undefined)
  return { nodes: graphNodes, links }
}

const DRUG_PALETTE = {
  mechanism: '#22d3ee',
  target: '#06b6d4',
  pathway: '#3b82f6',
  action: '#818cf8',
}

const DISEASE_PALETTE = {
  gene: '#e879f0',
  mechanism: '#d946ef',
  pathway: '#c026d3',
  symptom: '#f472b6',
}

/**
 * Combine drug and disease nodes into a single graph with
 * intra-domain links and every-to-every cross-domain links.
 *
 * Returns { nodes, links, crossPairs } where crossPairs is a
 * stable array for feeding to the hypothesis generator.
 */
export function buildMergedGraphData(drugNodes, diseaseNodes) {
  const dNodes = drugNodes.map((n) => ({
    ...n,
    domain: 'drug',
    color: DRUG_PALETTE[n.category] || '#22d3ee',
  }))

  const eNodes = diseaseNodes.map((n) => ({
    ...n,
    domain: 'disease',
    color: DISEASE_PALETTE[n.category] || '#e879f0',
  }))

  const nodes = [...dNodes, ...eNodes]

  const links = [
    ...buildIntraLinks(dNodes, 'drug'),
    ...buildIntraLinks(eNodes, 'disease'),
  ]

  const crossPairs = []

  for (const d of dNodes) {
    for (const e of eNodes) {
      const linkId = `${d.id}-${e.id}`

      links.push({
        source: d.id,
        target: e.id,
        linkId,
        cross: true,
      })

      crossPairs.push({
        linkId,
        drugNodeId: d.id,
        drugLabel: d.label,
        drugDescription: d.description,
        diseaseNodeId: e.id,
        diseaseLabel: e.label,
        diseaseDescription: e.description,
      })
    }
  }

  return { nodes, links, crossPairs }
}
