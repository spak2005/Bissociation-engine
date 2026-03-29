/**
 * Convert an array of LLM-generated nodes into a react-force-graph
 * data object with intra-category links.
 *
 * Nodes in the same category are linked to form visual clusters.
 * An additional hub-and-spoke pattern connects the first node of
 * each category to the first node of every other category, giving
 * the graph a connected shape even across categories.
 */
export function buildGraphData(nodes) {
  const graphNodes = nodes.map((n) => ({ ...n }))

  const links = []

  const byCategory = {}
  for (const node of graphNodes) {
    const cat = node.category
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(node)
  }

  for (const group of Object.values(byCategory)) {
    for (let i = 0; i < group.length - 1; i++) {
      links.push({ source: group[i].id, target: group[i + 1].id })
    }
  }

  const categoryHeads = Object.values(byCategory).map((g) => g[0])
  for (let i = 0; i < categoryHeads.length - 1; i++) {
    links.push({
      source: categoryHeads[i].id,
      target: categoryHeads[i + 1].id,
    })
  }

  return { nodes: graphNodes, links }
}
